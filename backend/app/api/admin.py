from datetime import date, datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from app.database.connection import get_db
from app.models.models import (
    Order, OrderStatus, User, UserRole, DeliveryAgent, Zone, Area,
    RateCard, CustomerProfile, TrackingEvent, AgentAvailability
)
from app.schemas.schemas import (
    ZoneCreate, ZoneUpdate, ZoneOut, AreaCreate, AreaUpdate, AreaOut,
    RateCardCreate, RateCardUpdate, RateCardOut, AgentCreate, AgentUpdate,
    AgentOut, UserOut, AdminDashboard
)
from app.auth.jwt import get_current_user, require_admin
from app.api.orders import serialize_order

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ─── Dashboard ───────────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    today = datetime.now(timezone.utc).date()

    total_orders = db.query(Order).count()
    active_statuses = [
        OrderStatus.ASSIGNED, OrderStatus.PICKED_UP,
        OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.RESCHEDULED
    ]
    active_deliveries = db.query(Order).filter(Order.status.in_(active_statuses)).count()
    delivered_today = db.query(Order).filter(
        Order.status == OrderStatus.DELIVERED,
        func.date(Order.updated_at) == today,
    ).count()
    failed_deliveries = db.query(Order).filter(Order.status == OrderStatus.FAILED).count()
    available_agents = db.query(DeliveryAgent).filter(
        DeliveryAgent.availability_status == AgentAvailability.AVAILABLE
    ).count()
    total_revenue = db.query(func.sum(Order.total_charge)).filter(
        Order.status == OrderStatus.DELIVERED
    ).scalar() or 0.0

    # Orders by status
    status_counts = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    orders_by_status = {s.value: count for s, count in status_counts}

    # Orders by zone (pickup zone)
    zone_counts = db.query(Zone.code, func.count(Order.id)).join(
        Order, Order.pickup_zone_id == Zone.id
    ).group_by(Zone.code).all()
    orders_by_zone = {code: count for code, count in zone_counts}

    return {
        "total_orders": total_orders,
        "active_deliveries": active_deliveries,
        "delivered_today": delivered_today,
        "failed_deliveries": failed_deliveries,
        "available_agents": available_agents,
        "total_revenue": float(total_revenue),
        "orders_by_status": orders_by_status,
        "orders_by_zone": orders_by_zone,
    }


# ─── Orders ──────────────────────────────────────────────────────────────────

@router.get("/orders")
def get_all_orders(
    status: Optional[str] = None,
    zone_id: Optional[int] = None,
    agent_id: Optional[int] = None,
    order_type: Optional[str] = None,
    payment_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.pickup_zone),
        joinedload(Order.drop_zone),
        joinedload(Order.assigned_agent).joinedload(DeliveryAgent.user),
        joinedload(Order.tracking_events).joinedload(TrackingEvent.actor),
        joinedload(Order.pickup_area).joinedload(Area.zone),
        joinedload(Order.drop_area).joinedload(Area.zone),
    )

    if status:
        try:
            query = query.filter(Order.status == OrderStatus[status.upper()])
        except KeyError:
            pass
    if zone_id:
        query = query.filter(
            (Order.pickup_zone_id == zone_id) | (Order.drop_zone_id == zone_id)
        )
    if agent_id:
        query = query.filter(Order.assigned_agent_id == agent_id)
    if order_type:
        query = query.filter(Order.order_type == order_type.upper())
    if payment_type:
        query = query.filter(Order.payment_type == payment_type.upper())
    if search:
        query = query.filter(Order.tracking_number.ilike(f"%{search}%"))

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "orders": [serialize_order(o) for o in orders],
    }


# ─── Users ───────────────────────────────────────────────────────────────────

@router.get("/users")
def get_all_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(User)
    if role:
        try:
            query = query.filter(User.role == UserRole[role.upper()])
        except KeyError:
            pass
    users = query.all()
    return [UserOut.model_validate(u) for u in users]


@router.get("/customers")
def get_all_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    customers = db.query(CustomerProfile).options(
        joinedload(CustomerProfile.user)
    ).all()
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "address": c.address,
            "user": UserOut.model_validate(c.user) if c.user else None,
        }
        for c in customers
    ]


# ─── Agents ──────────────────────────────────────────────────────────────────

@router.get("/agents")
def get_all_agents(
    availability: Optional[str] = None,
    zone_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(DeliveryAgent).options(
        joinedload(DeliveryAgent.user),
        joinedload(DeliveryAgent.current_zone),
    )
    if availability:
        try:
            query = query.filter(
                DeliveryAgent.availability_status == AgentAvailability[availability.upper()]
            )
        except KeyError:
            pass
    if zone_id:
        query = query.filter(DeliveryAgent.current_zone_id == zone_id)

    agents = query.all()
    return [AgentOut.model_validate(a) for a in agents]


@router.post("/agents", status_code=201)
def create_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Verify user exists and is AGENT role
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(DeliveryAgent).filter(DeliveryAgent.user_id == payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Agent profile already exists for this user")

    agent = DeliveryAgent(**payload.model_dump())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return AgentOut.model_validate(agent)


@router.patch("/agents/{agent_id}")
def update_agent(
    agent_id: int,
    payload: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    agent = db.query(DeliveryAgent).filter(DeliveryAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(agent, field, value)

    db.commit()
    db.refresh(agent)
    return AgentOut.model_validate(agent)


# ─── Zones ───────────────────────────────────────────────────────────────────

@router.get("/zones")
def get_zones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zones = db.query(Zone).all()
    return [ZoneOut.model_validate(z) for z in zones]


@router.post("/zones", status_code=201)
def create_zone(
    payload: ZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(Zone).filter(Zone.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Zone code '{payload.code}' already exists")

    zone = Zone(**payload.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return ZoneOut.model_validate(zone)


@router.patch("/zones/{zone_id}")
def update_zone(
    zone_id: int,
    payload: ZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(zone, field, value)

    db.commit()
    db.refresh(zone)
    return ZoneOut.model_validate(zone)


# ─── Areas ───────────────────────────────────────────────────────────────────

@router.get("/areas")
def get_areas(
    zone_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Area).options(joinedload(Area.zone))
    if zone_id:
        query = query.filter(Area.zone_id == zone_id)
    areas = query.all()
    return [AreaOut.model_validate(a) for a in areas]


@router.post("/areas", status_code=201)
def create_area(
    payload: AreaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    zone = db.query(Zone).filter(Zone.id == payload.zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    area = Area(**payload.model_dump())
    db.add(area)
    db.commit()
    db.refresh(area)
    return AreaOut.model_validate(area)


@router.patch("/areas/{area_id}")
def update_area(
    area_id: int,
    payload: AreaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    if payload.zone_id:
        zone = db.query(Zone).filter(Zone.id == payload.zone_id).first()
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(area, field, value)

    db.commit()
    db.refresh(area)
    return AreaOut.model_validate(area)


# ─── Rate Cards ───────────────────────────────────────────────────────────────

@router.get("/rates")
def get_rate_cards(
    order_type: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(RateCard).options(
        joinedload(RateCard.from_zone),
        joinedload(RateCard.to_zone),
    )
    if order_type:
        query = query.filter(RateCard.order_type == order_type.upper())
    if active_only:
        query = query.filter(RateCard.is_active == True)

    rates = query.all()
    return [RateCardOut.model_validate(r) for r in rates]


@router.post("/rates", status_code=201)
def create_rate_card(
    payload: RateCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rate = RateCard(**payload.model_dump())
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return RateCardOut.model_validate(rate)


@router.patch("/rates/{rate_id}")
def update_rate_card(
    rate_id: int,
    payload: RateCardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rate = db.query(RateCard).filter(RateCard.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate card not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(rate, field, value)

    db.commit()
    db.refresh(rate)
    return RateCardOut.model_validate(rate)


@router.delete("/rates/{rate_id}", status_code=204)
def delete_rate_card(
    rate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rate = db.query(RateCard).filter(RateCard.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate card not found")

    # Soft delete — just deactivate
    rate.is_active = False
    db.commit()
    return None
