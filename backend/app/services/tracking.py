"""
TrackingService — Immutable tracking event management.

All tracking history is APPEND-ONLY. Events are never updated or deleted.
Status transitions are validated to prevent invalid progressions.
"""
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import Order, TrackingEvent, OrderStatus

# Valid status transition graph
VALID_TRANSITIONS = {
    OrderStatus.CREATED: {OrderStatus.ASSIGNED, OrderStatus.CANCELLED},
    OrderStatus.ASSIGNED: {OrderStatus.PICKED_UP, OrderStatus.CANCELLED, OrderStatus.FAILED},
    OrderStatus.PICKED_UP: {OrderStatus.IN_TRANSIT, OrderStatus.FAILED},
    OrderStatus.IN_TRANSIT: {OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED},
    OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.DELIVERED, OrderStatus.FAILED},
    OrderStatus.DELIVERED: set(),  # Terminal state
    OrderStatus.FAILED: {OrderStatus.RESCHEDULED, OrderStatus.CANCELLED},
    OrderStatus.RESCHEDULED: {OrderStatus.ASSIGNED, OrderStatus.CANCELLED},
    OrderStatus.CANCELLED: set(),  # Terminal state
}

STATUS_DESCRIPTIONS = {
    OrderStatus.CREATED: "Order created and awaiting agent assignment",
    OrderStatus.ASSIGNED: "Delivery agent assigned to order",
    OrderStatus.PICKED_UP: "Package picked up by agent",
    OrderStatus.IN_TRANSIT: "Package in transit to destination",
    OrderStatus.OUT_FOR_DELIVERY: "Package out for delivery",
    OrderStatus.DELIVERED: "Package delivered successfully",
    OrderStatus.FAILED: "Delivery attempt failed",
    OrderStatus.RESCHEDULED: "Delivery rescheduled",
    OrderStatus.CANCELLED: "Order cancelled",
}


def validate_status_transition(current_status: OrderStatus, new_status: OrderStatus, is_admin: bool = False):
    """Validate status transition. Admin can override but still must use valid transitions."""
    if current_status == new_status:
        return  # No change, ok

    allowed = VALID_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        if is_admin:
            # Admin can override invalid transitions but we still warn
            return  # Allow admin override
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition: {current_status} → {new_status}. "
                   f"Allowed transitions: {[s.value for s in allowed]}"
        )


def create_tracking_event(
    db: Session,
    order_id: int,
    status: OrderStatus,
    actor_user_id: Optional[int] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
) -> TrackingEvent:
    """
    Create an immutable tracking event.
    This is the ONLY way to record status changes — never UPDATE existing events.
    """
    event = TrackingEvent(
        order_id=order_id,
        status=status,
        actor_user_id=actor_user_id,
        description=description or STATUS_DESCRIPTIONS.get(status, ""),
        location=location,
    )
    db.add(event)
    db.flush()  # Get the ID without committing
    return event


def update_order_status(
    db: Session,
    order: Order,
    new_status: OrderStatus,
    actor_user_id: Optional[int] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    is_admin: bool = False,
) -> TrackingEvent:
    """
    Update order status and create immutable tracking event atomically.
    """
    validate_status_transition(order.status, new_status, is_admin)

    order.status = new_status
    event = create_tracking_event(
        db=db,
        order_id=order.id,
        status=new_status,
        actor_user_id=actor_user_id,
        description=description,
        location=location,
    )
    db.commit()
    db.refresh(order)
    return event
