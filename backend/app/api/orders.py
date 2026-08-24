import random
import string
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database.connection import get_db
from app.models.models import (
    Order, OrderStatus, CustomerProfile, User, UserRole,
    DeliveryAgent, AgentAvailability, TrackingEvent, Area
)
from app.schemas.schemas import (
    OrderCreate, OrderOut, OrderListOut, OrderStatusUpdate,
    PriceCalculationRequest, PriceBreakdown, FailedDeliveryUpdate,
    RescheduleRequest, ManualAssignRequest
)
from app.auth.jwt import get_current_user, require_role
from app.services.pricing import calculate_delivery_charge
from app.services.assignment import auto_assign_agent, find_nearest_agent, assign_agent_to_order
from app.services.tracking import update_order_status, create_tracking_event
from app.services.notification import notify_order_status
from app.services.delivery_intelligence import get_delivery_intelligence, calculate_eta, calculate_risk_score

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def generate_tracking_number() -> str:
    date_str = datetime.now().strftime("%Y%m%d")
    chars = random.choices(string.ascii_uppercase + string.digits, k=4)
    return f"LMD-{date_str}-{''.join(chars)}"


def serialize_order(order: Order) -> dict:
    """Serialize order with nested relations."""
    customer_user = order.customer.user if order.customer else None
    return {
        "id": order.id,
        "tracking_number": order.tracking_number,
        "customer_id": order.customer_id,
        "pickup_address": order.pickup_address,
        "pickup_area_id": order.pickup_area_id,
        "pickup_zone_id": order.pickup_zone_id,
        "drop_address": order.drop_address,
        "drop_area_id": order.drop_area_id,
        "drop_zone_id": order.drop_zone_id,
        "length": order.length,
        "width": order.width,
        "height": order.height,
        "actual_weight": order.actual_weight,
        "volumetric_weight": order.volumetric_weight,
        "chargeable_weight": order.chargeable_weight,
        "order_type": order.order_type,
        "payment_type": order.payment_type,
        "base_charge": order.base_charge,
        "cod_surcharge": order.cod_surcharge,
        "total_charge": order.total_charge,
        "assigned_agent_id": order.assigned_agent_id,
        "status": order.status,
        "failure_reason": order.failure_reason,
        "reschedule_date": order.reschedule_date,
        "reschedule_note": order.reschedule_note,
        "estimated_delivery_time": order.estimated_delivery_time,
        "delivery_risk_score": order.delivery_risk_score,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "customer": {
            "id": customer_user.id,
            "name": customer_user.name,
            "email": customer_user.email,
            "phone": customer_user.phone,
        } if customer_user else None,
        "pickup_area": {
            "id": order.pickup_area.id,
            "name": order.pickup_area.name,
            "postal_code": order.pickup_area.postal_code,
            "zone_id": order.pickup_area.zone_id,
            "zone": {"id": order.pickup_zone.id, "name": order.pickup_zone.name, "code": order.pickup_zone.code, "is_active": order.pickup_zone.is_active},
        } if order.pickup_area else None,
        "drop_area": {
            "id": order.drop_area.id,
            "name": order.drop_area.name,
            "postal_code": order.drop_area.postal_code,
            "zone_id": order.drop_area.zone_id,
            "zone": {"id": order.drop_zone.id, "name": order.drop_zone.name, "code": order.drop_zone.code, "is_active": order.drop_zone.is_active},
        } if order.drop_area else None,
        "pickup_zone": {"id": order.pickup_zone.id, "name": order.pickup_zone.name, "code": order.pickup_zone.code, "is_active": order.pickup_zone.is_active} if order.pickup_zone else None,
        "drop_zone": {"id": order.drop_zone.id, "name": order.drop_zone.name, "code": order.drop_zone.code, "is_active": order.drop_zone.is_active} if order.drop_zone else None,
        "assigned_agent": {
            "id": order.assigned_agent.id,
            "user_id": order.assigned_agent.user_id,
            "availability_status": order.assigned_agent.availability_status,
            "vehicle_type": order.assigned_agent.vehicle_type,
            "user": {
                "id": order.assigned_agent.user.id,
                "name": order.assigned_agent.user.name,
                "email": order.assigned_agent.user.email,
                "phone": order.assigned_agent.user.phone,
                "role": order.assigned_agent.user.role,
                "created_at": order.assigned_agent.user.created_at,
            } if order.assigned_agent and order.assigned_agent.user else None,
        } if order.assigned_agent else None,
        "tracking_events": [
            {
                "id": e.id,
                "order_id": e.order_id,
                "status": e.status,
                "timestamp": e.timestamp,
                "actor_user_id": e.actor_user_id,
                "description": e.description,
                "location": e.location,
                "actor": {
                    "id": e.actor.id,
                    "name": e.actor.name,
                    "email": e.actor.email,
                    "role": e.actor.role,
                    "created_at": e.actor.created_at,
                } if e.actor else None,
            }
            for e in order.tracking_events
        ] if order.tracking_events else [],
    }


@router.post("/calculate", response_model=PriceBreakdown)
def calculate_price(payload: PriceCalculationRequest, db: Session = Depends(get_db)):
    """Preview delivery charge before order creation."""
    return calculate_delivery_charge(
        db=db,
        pickup_area_id=payload.pickup_area_id,
        drop_area_id=payload.drop_area_id,
        length=payload.length,
        width=payload.width,
        height=payload.height,
        actual_weight=payload.actual_weight,
        order_type=payload.order_type,
        payment_type=payload.payment_type,
    )


@router.post("", status_code=201)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new delivery order."""
    # Determine customer profile
    if current_user.role == UserRole.ADMIN and payload.customer_id:
        # Admin creating order on behalf of customer
        customer_profile = db.query(CustomerProfile).filter(
            CustomerProfile.id == payload.customer_id
        ).first()
        if not customer_profile:
            raise HTTPException(status_code=404, detail="Customer profile not found")
    elif current_user.role == UserRole.CUSTOMER:
        customer_profile = db.query(CustomerProfile).filter(
            CustomerProfile.user_id == current_user.id
        ).first()
        if not customer_profile:
            raise HTTPException(status_code=400, detail="Customer profile not found")
    else:
        raise HTTPException(status_code=403, detail="Only customers or admins can create orders")

    # Calculate pricing
    pricing = calculate_delivery_charge(
        db=db,
        pickup_area_id=payload.pickup_area_id,
        drop_area_id=payload.drop_area_id,
        length=payload.length,
        width=payload.width,
        height=payload.height,
        actual_weight=payload.actual_weight,
        order_type=payload.order_type,
        payment_type=payload.payment_type,
    )

    # Generate unique tracking number
    tracking_number = generate_tracking_number()
    while db.query(Order).filter(Order.tracking_number == tracking_number).first():
        tracking_number = generate_tracking_number()

    # Create order
    order = Order(
        tracking_number=tracking_number,
        customer_id=customer_profile.id,
        pickup_address=payload.pickup_address,
        pickup_area_id=payload.pickup_area_id,
        pickup_zone_id=pricing.pickup_zone_id,
        drop_address=payload.drop_address,
        drop_area_id=payload.drop_area_id,
        drop_zone_id=pricing.drop_zone_id,
        length=payload.length,
        width=payload.width,
        height=payload.height,
        actual_weight=payload.actual_weight,
        volumetric_weight=pricing.volumetric_weight,
        chargeable_weight=pricing.chargeable_weight,
        order_type=payload.order_type,
        payment_type=payload.payment_type,
        base_charge=pricing.base_charge,
        cod_surcharge=pricing.cod_surcharge,
        total_charge=pricing.total_charge,
        status=OrderStatus.CREATED,
        delivery_risk_score=0,
    )
    db.add(order)
    db.flush()

    # Create initial tracking event
    create_tracking_event(
        db=db,
        order_id=order.id,
        status=OrderStatus.CREATED,
        actor_user_id=current_user.id,
        description="Order created and awaiting agent assignment",
    )

    # Auto-assign agent
    try:
        agent = find_nearest_agent(db, order)
        if agent:
            order.assigned_agent_id = agent.id
            agent.availability_status = AgentAvailability.BUSY
            db.flush()
            create_tracking_event(
                db=db,
                order_id=order.id,
                status=OrderStatus.ASSIGNED,
                actor_user_id=None,
                description=f"Auto-assigned to agent {agent.user.name if agent.user else 'Unknown'}",
            )
            order.status = OrderStatus.ASSIGNED
    except Exception:
        pass  # Order stays CREATED if no agent available

    # Update ETA and risk
    db.refresh(order)
    try:
        eta_from, eta_to = calculate_eta(order)
        order.estimated_delivery_time = eta_from
        risk_score, _, _ = calculate_risk_score(order, db)
        order.delivery_risk_score = risk_score
    except Exception:
        pass

    db.commit()
    db.refresh(order)

    # Send notifications
    notify_order_status(db, order, "CREATED")
    if order.status == OrderStatus.ASSIGNED:
        notify_order_status(db, order, "ASSIGNED")
    db.commit()

    return serialize_order(order)


@router.get("")
def list_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List orders for current user."""
    query = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.pickup_area).joinedload(Area.zone),
        joinedload(Order.drop_area).joinedload(Area.zone),
        joinedload(Order.pickup_zone),
        joinedload(Order.drop_zone),
        joinedload(Order.assigned_agent).joinedload(DeliveryAgent.user),
        joinedload(Order.assigned_agent).joinedload(DeliveryAgent.current_zone),
        joinedload(Order.tracking_events).joinedload(TrackingEvent.actor),
    )

    if current_user.role == UserRole.CUSTOMER:
        customer_profile = db.query(CustomerProfile).filter(
            CustomerProfile.user_id == current_user.id
        ).first()
        if customer_profile:
            query = query.filter(Order.customer_id == customer_profile.id)
        else:
            return []
    elif current_user.role == UserRole.AGENT:
        agent = db.query(DeliveryAgent).filter(
            DeliveryAgent.user_id == current_user.id
        ).first()
        if agent:
            query = query.filter(Order.assigned_agent_id == agent.id)
        else:
            return []

    if status:
        try:
            order_status = OrderStatus[status.upper()]
            query = query.filter(Order.status == order_status)
        except KeyError:
            pass

    orders = query.order_by(Order.created_at.desc()).all()
    return [serialize_order(o) for o in orders]


@router.get("/track/{tracking_number}")
def track_order(tracking_number: str, db: Session = Depends(get_db)):
    """Public tracking endpoint — no auth required."""
    order = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.pickup_area).joinedload(Area.zone),
        joinedload(Order.drop_area).joinedload(Area.zone),
        joinedload(Order.pickup_zone),
        joinedload(Order.drop_zone),
        joinedload(Order.assigned_agent).joinedload(DeliveryAgent.user),
        joinedload(Order.tracking_events).joinedload(TrackingEvent.actor),
    ).filter(Order.tracking_number == tracking_number).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    result = serialize_order(order)
    result["intelligence"] = get_delivery_intelligence(order, db)
    return result


@router.get("/{order_id}")
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific order with full details."""
    order = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.pickup_area).joinedload(Area.zone),
        joinedload(Order.drop_area).joinedload(Area.zone),
        joinedload(Order.pickup_zone),
        joinedload(Order.drop_zone),
        joinedload(Order.assigned_agent).joinedload(DeliveryAgent.user),
        joinedload(Order.tracking_events).joinedload(TrackingEvent.actor),
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Authorization check
    if current_user.role == UserRole.CUSTOMER:
        profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
        if not profile or order.customer_id != profile.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == UserRole.AGENT:
        agent = db.query(DeliveryAgent).filter(DeliveryAgent.user_id == current_user.id).first()
        if not agent or order.assigned_agent_id != agent.id:
            raise HTTPException(status_code=403, detail="Access denied")

    result = serialize_order(order)
    result["intelligence"] = get_delivery_intelligence(order, db)
    return result


@router.patch("/{order_id}/status")
def update_order_status_endpoint(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update order status (agent or admin)."""
    order = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.tracking_events),
        joinedload(Order.assigned_agent).joinedload(DeliveryAgent.user),
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_admin = current_user.role == UserRole.ADMIN

    # Agent can only update their own orders
    if current_user.role == UserRole.AGENT:
        agent = db.query(DeliveryAgent).filter(DeliveryAgent.user_id == current_user.id).first()
        if not agent or order.assigned_agent_id != agent.id:
            raise HTTPException(status_code=403, detail="You can only update your assigned orders")

        # Agents cannot set status to certain admin-only statuses
        if payload.status in (OrderStatus.CANCELLED,):
            raise HTTPException(status_code=403, detail="Agents cannot cancel orders")

    update_order_status(
        db=db,
        order=order,
        new_status=payload.status,
        actor_user_id=current_user.id,
        description=payload.description,
        location=payload.location,
        is_admin=is_admin,
    )

    # If delivered, free the agent
    if payload.status == OrderStatus.DELIVERED and order.assigned_agent_id:
        agent = db.query(DeliveryAgent).filter(DeliveryAgent.id == order.assigned_agent_id).first()
        if agent:
            agent.availability_status = AgentAvailability.AVAILABLE
            db.commit()

    # Update intelligence
    db.refresh(order)
    try:
        eta_from, _ = calculate_eta(order)
        order.estimated_delivery_time = eta_from
        risk_score, _, _ = calculate_risk_score(order, db)
        order.delivery_risk_score = risk_score
        db.commit()
    except Exception:
        pass

    notify_order_status(db, order, payload.status.value)
    db.commit()

    return serialize_order(order)


@router.post("/{order_id}/fail")
def fail_delivery(
    order_id: int,
    payload: FailedDeliveryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark delivery as failed with reason. Creates immutable tracking event."""
    order = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.tracking_events),
        joinedload(Order.assigned_agent),
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Authorization: agent can only fail their own assigned order
    if current_user.role == UserRole.AGENT:
        agent = db.query(DeliveryAgent).filter(DeliveryAgent.user_id == current_user.id).first()
        if not agent or order.assigned_agent_id != agent.id:
            raise HTTPException(status_code=403, detail="You can only fail your assigned orders")

    if order.status not in (
        OrderStatus.ASSIGNED, OrderStatus.PICKED_UP,
        OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY
    ):
        raise HTTPException(status_code=400, detail=f"Cannot fail an order with status '{order.status}'")

    # Store failure reason before the status update
    order.failure_reason = payload.failure_reason

    # Use update_order_status for immutable event creation and validated transition
    from app.services.tracking import update_order_status as svc_update_status
    svc_update_status(
        db=db,
        order=order,
        new_status=OrderStatus.FAILED,
        actor_user_id=current_user.id,
        description=f"Delivery failed: {payload.failure_reason}. {payload.description or ''}".strip(". "),
    )

    # Free the agent so they can take new orders
    if order.assigned_agent_id:
        agent_rec = db.query(DeliveryAgent).filter(DeliveryAgent.id == order.assigned_agent_id).first()
        if agent_rec:
            agent_rec.availability_status = AgentAvailability.AVAILABLE
            db.commit()

    db.refresh(order)
    notify_order_status(db, order, "FAILED", f"Reason: {payload.failure_reason}")
    db.commit()

    return serialize_order(order)



@router.post("/{order_id}/reschedule")
def reschedule_order(
    order_id: int,
    payload: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reschedule a failed delivery."""
    order = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.tracking_events),
        joinedload(Order.assigned_agent),
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Only customers can reschedule their own orders, or admin
    if current_user.role == UserRole.CUSTOMER:
        profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
        if not profile or order.customer_id != profile.id:
            raise HTTPException(status_code=403, detail="Access denied")

    if order.status != OrderStatus.FAILED:
        raise HTTPException(status_code=400, detail="Only failed orders can be rescheduled")

    order.reschedule_date = payload.reschedule_date
    order.reschedule_note = payload.note
    order.status = OrderStatus.RESCHEDULED
    order.assigned_agent_id = None  # Clear old agent

    create_tracking_event(
        db=db,
        order_id=order.id,
        status=OrderStatus.RESCHEDULED,
        actor_user_id=current_user.id,
        description=f"Delivery rescheduled to {payload.reschedule_date.strftime('%Y-%m-%d')}. {payload.note or ''}",
    )
    db.commit()
    db.refresh(order)

    # Try to assign new agent
    try:
        agent = find_nearest_agent(db, order)
        if agent:
            order.assigned_agent_id = agent.id
            agent.availability_status = AgentAvailability.BUSY
            db.flush()
            create_tracking_event(
                db=db,
                order_id=order.id,
                status=OrderStatus.ASSIGNED,
                actor_user_id=None,
                description=f"New agent assigned after reschedule: {agent.user.name if agent.user else 'Unknown'}",
            )
            order.status = OrderStatus.ASSIGNED
    except Exception:
        pass

    # Update intelligence
    try:
        eta_from, _ = calculate_eta(order)
        order.estimated_delivery_time = payload.reschedule_date
        risk_score, _, _ = calculate_risk_score(order, db)
        order.delivery_risk_score = risk_score
    except Exception:
        pass

    db.commit()
    db.refresh(order)

    notify_order_status(db, order, "RESCHEDULED")
    db.commit()

    return serialize_order(order)


@router.post("/{order_id}/assign")
def manual_assign(
    order_id: int,
    payload: ManualAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Manually assign a specific agent to an order (Admin only)."""
    order = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.tracking_events),
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    agent = db.query(DeliveryAgent).filter(DeliveryAgent.id == payload.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.availability_status != AgentAvailability.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Agent is not available (status: {agent.availability_status})")

    # Release previous agent if any
    if order.assigned_agent_id and order.assigned_agent_id != payload.agent_id:
        old_agent = db.query(DeliveryAgent).filter(DeliveryAgent.id == order.assigned_agent_id).first()
        if old_agent:
            old_agent.availability_status = AgentAvailability.AVAILABLE

    order.assigned_agent_id = agent.id
    agent.availability_status = AgentAvailability.BUSY

    prev_status = order.status
    if order.status == OrderStatus.CREATED:
        order.status = OrderStatus.ASSIGNED

    create_tracking_event(
        db=db,
        order_id=order.id,
        status=OrderStatus.ASSIGNED,
        actor_user_id=current_user.id,
        description=f"Manually assigned to agent {agent.user.name if agent.user else str(agent.id)}",
    )
    db.commit()
    db.refresh(order)

    notify_order_status(db, order, "ASSIGNED")
    db.commit()

    return serialize_order(order)


@router.post("/{order_id}/auto-assign")
def auto_assign_endpoint(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Auto-assign the nearest available agent (Admin only)."""
    order = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.tracking_events),
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Release previous agent
    if order.assigned_agent_id:
        old_agent = db.query(DeliveryAgent).filter(DeliveryAgent.id == order.assigned_agent_id).first()
        if old_agent:
            old_agent.availability_status = AgentAvailability.AVAILABLE
        order.assigned_agent_id = None

    agent = auto_assign_agent(db, order, current_user.id)
    order.status = OrderStatus.ASSIGNED

    create_tracking_event(
        db=db,
        order_id=order.id,
        status=OrderStatus.ASSIGNED,
        actor_user_id=current_user.id,
        description=f"Auto-assigned to agent {agent.user.name if agent.user else str(agent.id)}",
    )
    db.commit()
    db.refresh(order)

    notify_order_status(db, order, "ASSIGNED")
    db.commit()

    return serialize_order(order)


@router.get("/{order_id}/intelligence")
def get_order_intelligence(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get Smart Delivery Intelligence for an order."""
    order = db.query(Order).options(
        joinedload(Order.tracking_events),
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return get_delivery_intelligence(order, db)
