from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database.connection import get_db
from app.models.models import (
    DeliveryAgent, Order, OrderStatus, User, UserRole,
    AgentAvailability, CustomerProfile, Area, TrackingEvent
)
from app.schemas.schemas import AgentAvailabilityUpdate, AgentLocationUpdate, AgentOut, AgentDashboard
from app.auth.jwt import get_current_user, require_agent
from app.api.orders import serialize_order
from datetime import datetime, timezone, date

router = APIRouter(prefix="/api/agent", tags=["Agent"])


def get_agent_or_404(db: Session, current_user: User) -> DeliveryAgent:
    agent = db.query(DeliveryAgent).options(
        joinedload(DeliveryAgent.user),
        joinedload(DeliveryAgent.current_zone),
    ).filter(DeliveryAgent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found")
    return agent


@router.get("/profile", response_model=AgentOut)
def get_agent_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent),
):
    return AgentOut.model_validate(get_agent_or_404(db, current_user))


@router.get("/dashboard")
def get_agent_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent),
):
    agent = get_agent_or_404(db, current_user)
    today = datetime.now(timezone.utc).date()

    all_orders = db.query(Order).filter(Order.assigned_agent_id == agent.id).all()

    today_deliveries = sum(
        1 for o in all_orders
        if o.created_at and (
            o.created_at.date() if hasattr(o.created_at, 'date') else
            datetime.fromisoformat(str(o.created_at)).date()
        ) == today
    )

    completed = sum(1 for o in all_orders if o.status == OrderStatus.DELIVERED)
    pending = sum(1 for o in all_orders if o.status in (
        OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY
    ))
    failed = sum(1 for o in all_orders if o.status == OrderStatus.FAILED)

    return {
        "today_deliveries": today_deliveries,
        "completed": completed,
        "pending": pending,
        "failed": failed,
        "availability_status": agent.availability_status,
        "vehicle_type": agent.vehicle_type,
        "current_zone": {"id": agent.current_zone.id, "name": agent.current_zone.name, "code": agent.current_zone.code} if agent.current_zone else None,
    }


@router.get("/orders")
def get_agent_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent),
):
    agent = get_agent_or_404(db, current_user)

    query = db.query(Order).options(
        joinedload(Order.customer).joinedload(CustomerProfile.user),
        joinedload(Order.pickup_area).joinedload(Area.zone),
        joinedload(Order.drop_area).joinedload(Area.zone),
        joinedload(Order.pickup_zone),
        joinedload(Order.drop_zone),
        joinedload(Order.assigned_agent).joinedload(DeliveryAgent.user),
        joinedload(Order.tracking_events).joinedload(TrackingEvent.actor),
    ).filter(Order.assigned_agent_id == agent.id)

    if status:
        try:
            query = query.filter(Order.status == OrderStatus[status.upper()])
        except KeyError:
            pass

    orders = query.order_by(Order.created_at.desc()).all()
    return [serialize_order(o) for o in orders]


@router.patch("/availability")
def update_availability(
    payload: AgentAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent),
):
    agent = get_agent_or_404(db, current_user)
    agent.availability_status = payload.availability_status
    db.commit()
    db.refresh(agent)
    return AgentOut.model_validate(agent)


@router.patch("/location")
def update_location(
    payload: AgentLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent),
):
    agent = get_agent_or_404(db, current_user)
    agent.current_latitude = payload.latitude
    agent.current_longitude = payload.longitude
    if payload.zone_id:
        agent.current_zone_id = payload.zone_id
    db.commit()
    db.refresh(agent)
    return AgentOut.model_validate(agent)
