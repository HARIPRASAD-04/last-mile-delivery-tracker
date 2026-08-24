"""
AssignmentService — Intelligent agent assignment.

Strategy:
1. Filter available agents
2. Prefer agents in the pickup zone
3. Use Haversine distance if GPS coords available
4. Fall back to zone matching if no GPS
5. Select closest available agent
"""
import math
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.models import DeliveryAgent, Order, AgentAvailability
from fastapi import HTTPException


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in km between two GPS coordinates."""
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def find_nearest_agent(
    db: Session,
    order: Order,
    pickup_lat: Optional[float] = None,
    pickup_lon: Optional[float] = None,
) -> Optional[DeliveryAgent]:
    """
    Find the best available agent for an order.
    Returns None if no agents available.
    """
    available_agents: List[DeliveryAgent] = db.query(DeliveryAgent).filter(
        DeliveryAgent.availability_status == AgentAvailability.AVAILABLE
    ).all()

    if not available_agents:
        return None

    pickup_zone_id = order.pickup_zone_id

    # Score agents: lower score = better candidate
    scored: List[Tuple[float, int, DeliveryAgent]] = []

    for agent in available_agents:
        # Zone match bonus (lower = better)
        zone_penalty = 0.0 if agent.current_zone_id == pickup_zone_id else 100.0

        # GPS distance if available
        distance = 999.0  # default large value
        if (pickup_lat is not None and pickup_lon is not None and
                agent.current_latitude is not None and agent.current_longitude is not None):
            distance = haversine_distance(
                pickup_lat, pickup_lon,
                agent.current_latitude, agent.current_longitude
            )

        score = zone_penalty + distance
        scored.append((score, agent.id, agent))

    if not scored:
        return None

    # Sort by score ascending (best first)
    scored.sort(key=lambda x: (x[0], x[1]))
    return scored[0][2]


def assign_agent_to_order(
    db: Session,
    order: Order,
    agent: DeliveryAgent,
    actor_user_id: Optional[int] = None,
) -> Order:
    """Assign agent to order and mark agent as BUSY."""
    order.assigned_agent_id = agent.id
    agent.availability_status = AgentAvailability.BUSY
    db.commit()
    db.refresh(order)
    return order


def auto_assign_agent(
    db: Session,
    order: Order,
    actor_user_id: Optional[int] = None,
) -> DeliveryAgent:
    """Auto-assign nearest available agent. Raises if none available."""
    agent = find_nearest_agent(db, order)
    if not agent:
        raise HTTPException(
            status_code=400,
            detail="No available delivery agents at this time. Please try again later."
        )
    assign_agent_to_order(db, order, agent, actor_user_id)
    return agent
