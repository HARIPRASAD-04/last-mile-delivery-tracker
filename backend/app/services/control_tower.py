"""
ControlTowerService — Aggregates 6 summary/KPI metrics for the Control Tower:
1. active_deliveries: Orders in ASSIGNED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY
2. at_risk_deliveries: Orders with deterministic risk score >= 60
3. high_risk_deliveries: Orders with deterministic risk score >= 80
4. failed_deliveries: Orders currently in FAILED state
5. available_agents: Agents whose availability is AVAILABLE
6. busy_agents: Agents currently marked BUSY
"""
from sqlalchemy.orm import Session, joinedload
from app.models.models import Order, OrderStatus, DeliveryAgent, AgentAvailability
from app.services.delivery_intelligence import calculate_risk_score


def get_control_tower_summary(db: Session) -> dict:
    """
    Calculate 6 Network Summary metrics dynamically from the database.
    """
    active_statuses = [
        OrderStatus.ASSIGNED,
        OrderStatus.PICKED_UP,
        OrderStatus.IN_TRANSIT,
        OrderStatus.OUT_FOR_DELIVERY,
    ]

    active_deliveries = db.query(Order).filter(Order.status.in_(active_statuses)).count()
    failed_deliveries = db.query(Order).filter(Order.status == OrderStatus.FAILED).count()

    available_agents = db.query(DeliveryAgent).filter(
        DeliveryAgent.availability_status == AgentAvailability.AVAILABLE
    ).count()

    busy_agents = db.query(DeliveryAgent).filter(
        DeliveryAgent.availability_status == AgentAvailability.BUSY
    ).count()

    # Calculate risk scores for non-terminal orders
    non_terminal_orders = (
        db.query(Order)
        .options(joinedload(Order.tracking_events))
        .filter(Order.status.notin_([OrderStatus.DELIVERED, OrderStatus.CANCELLED]))
        .all()
    )

    at_risk_count = 0
    high_risk_count = 0

    for order in non_terminal_orders:
        calculated_score, _, _ = calculate_risk_score(order, db)
        score = max(order.delivery_risk_score or 0, calculated_score)
        if score >= 60:
            at_risk_count += 1
        if score >= 80:
            high_risk_count += 1

    return {
        "active_deliveries": active_deliveries,
        "at_risk_deliveries": at_risk_count,
        "high_risk_deliveries": high_risk_count,
        "failed_deliveries": failed_deliveries,
        "available_agents": available_agents,
        "busy_agents": busy_agents,
    }
