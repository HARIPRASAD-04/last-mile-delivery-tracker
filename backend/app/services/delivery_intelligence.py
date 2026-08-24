"""
DeliveryIntelligenceService — Smart Delivery ETA + Risk Scoring.

This is the USP feature. Uses deterministic scoring based on real order data.
No ML required — pure logistics heuristics.

Risk Score: 0–100
  0–30   = LOW RISK
  31–60  = MEDIUM RISK
  61–100 = HIGH RISK

ETA: Based on current status + zone distance + historical failure
"""
from datetime import datetime, timedelta, timezone
from typing import Tuple, List, Dict
from sqlalchemy.orm import Session
from app.models.models import Order, OrderStatus, TrackingEvent


# ETA in minutes by status
STATUS_ETA_MINUTES = {
    OrderStatus.CREATED: 240,          # 4 hours
    OrderStatus.ASSIGNED: 210,         # 3.5 hours
    OrderStatus.PICKED_UP: 150,        # 2.5 hours
    OrderStatus.IN_TRANSIT: 90,        # 1.5 hours
    OrderStatus.OUT_FOR_DELIVERY: 45,  # 45 minutes
}

# Zone distance penalty in minutes
ZONE_DISTANCE_PENALTY = {
    "intra": 0,     # same zone
    "near": 30,     # 1 zone away
    "far": 60,      # 2+ zones away
}


def calculate_zone_distance_level(pickup_zone_id: int, drop_zone_id: int) -> str:
    """Simplified zone distance: same, near (1 apart), far (2+ apart)."""
    if pickup_zone_id == drop_zone_id:
        return "intra"
    diff = abs(pickup_zone_id - drop_zone_id)
    return "near" if diff == 1 else "far"


def calculate_eta(order: Order) -> Tuple[datetime, datetime]:
    """
    Returns (eta_from, eta_to) as a window.
    """
    if order.status in (OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.FAILED):
        now = datetime.now(timezone.utc)
        return now, now

    base_minutes = STATUS_ETA_MINUTES.get(order.status, 240)

    # Zone distance adjustment
    zone_level = calculate_zone_distance_level(order.pickup_zone_id, order.drop_zone_id)
    penalty = ZONE_DISTANCE_PENALTY.get(zone_level, 0)

    # Check if order was previously failed/rescheduled (add delay)
    failed_attempts = sum(
        1 for e in order.tracking_events
        if e.status == OrderStatus.FAILED
    )
    failure_penalty = failed_attempts * 60  # 1 hour per failed attempt

    total_minutes = base_minutes + penalty + failure_penalty

    now = datetime.now(timezone.utc)
    eta_from = now + timedelta(minutes=total_minutes)
    eta_to = eta_from + timedelta(minutes=30)  # 30 min window

    return eta_from, eta_to


def calculate_risk_score(order: Order, db: Session) -> Tuple[int, List[str], List[str]]:
    """
    Calculate delivery risk score (0–100) with explanations.
    Returns (score, risk_factors, positive_factors)
    """
    score = 0
    risk_factors = []
    positive_factors = []

    # Factor 1: Previous failed attempts
    failed_events = [e for e in order.tracking_events if e.status == OrderStatus.FAILED]
    if failed_events:
        score += 30
        risk_factors.append(f"Previous failed delivery attempt ({len(failed_events)}x)")
    else:
        positive_factors.append("No previous failed attempts")

    # Factor 2: Zone distance (inter-zone = higher risk)
    zone_level = calculate_zone_distance_level(order.pickup_zone_id, order.drop_zone_id)
    if zone_level == "far":
        score += 20
        risk_factors.append("Long-distance inter-zone delivery")
    elif zone_level == "near":
        score += 10
        risk_factors.append("Inter-zone delivery")
    else:
        positive_factors.append("Intra-zone delivery (short distance)")

    # Factor 3: Agent assignment
    if order.assigned_agent_id:
        positive_factors.append("Agent assigned")
        # Check if agent was reassigned (rescheduled = potential reassignment)
        rescheduled_events = [e for e in order.tracking_events if e.status == OrderStatus.RESCHEDULED]
        if rescheduled_events:
            score += 15
            risk_factors.append("Order was rescheduled (agent may be reassigned)")
    else:
        score += 20
        risk_factors.append("No agent assigned yet")

    # Factor 4: Order age / delay risk
    from datetime import timezone as tz
    now = datetime.now(tz.utc)
    order_age_hours = (now - order.created_at.replace(tzinfo=tz.utc) if order.created_at.tzinfo is None else now - order.created_at).total_seconds() / 3600

    if order_age_hours > 24 and order.status not in (OrderStatus.DELIVERED, OrderStatus.CANCELLED):
        score += 15
        risk_factors.append("Order pending for over 24 hours")
    elif order_age_hours < 4:
        positive_factors.append("Recently created order")

    # Factor 5: Payment type (COD slightly higher risk)
    if order.payment_type.value == "COD":
        score += 5
        risk_factors.append("COD payment (customer must be present)")
    else:
        positive_factors.append("Prepaid — no cash collection needed")

    # Clamp to 0–100
    score = min(100, max(0, score))

    return score, risk_factors, positive_factors


def get_risk_category(score: int) -> str:
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "MEDIUM"
    return "HIGH"


def get_delivery_intelligence(order: Order, db: Session) -> Dict:
    """
    Full Smart Delivery Intelligence payload for an order.
    """
    eta_from, eta_to = calculate_eta(order)
    score, risk_factors, positive_factors = calculate_risk_score(order, db)
    category = get_risk_category(score)
    confidence = 100 - score

    return {
        "eta_from": eta_from.isoformat(),
        "eta_to": eta_to.isoformat(),
        "risk_score": score,
        "risk_category": category,
        "confidence": confidence,
        "risk_factors": risk_factors,
        "positive_factors": positive_factors,
    }
