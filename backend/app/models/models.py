from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey,
    Enum as SQLEnum, Text, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    AGENT = "AGENT"
    ADMIN = "ADMIN"


class AgentAvailability(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"


class VehicleType(str, enum.Enum):
    BIKE = "BIKE"
    SCOOTER = "SCOOTER"
    VAN = "VAN"
    TRUCK = "TRUCK"


class OrderType(str, enum.Enum):
    B2B = "B2B"
    B2C = "B2C"


class PaymentType(str, enum.Enum):
    PREPAID = "PREPAID"
    COD = "COD"


class OrderStatus(str, enum.Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    RESCHEDULED = "RESCHEDULED"
    CANCELLED = "CANCELLED"


class NotificationType(str, enum.Enum):
    ORDER_CREATED = "ORDER_CREATED"
    AGENT_ASSIGNED = "AGENT_ASSIGNED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    RESCHEDULED = "RESCHEDULED"
    CANCELLED = "CANCELLED"
    GENERAL = "GENERAL"


# ─── Models ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False)
    agent_profile = relationship("DeliveryAgent", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", foreign_keys="Notification.user_id")
    tracking_events = relationship("TrackingEvent", back_populates="actor", foreign_keys="TrackingEvent.actor_user_id")


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    address = Column(Text, nullable=True)

    user = relationship("User", back_populates="customer_profile")
    orders = relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    areas = relationship("Area", back_populates="zone")
    agents = relationship("DeliveryAgent", back_populates="current_zone", foreign_keys="DeliveryAgent.current_zone_id")
    pickup_rate_cards = relationship("RateCard", back_populates="from_zone", foreign_keys="RateCard.from_zone_id")
    dropoff_rate_cards = relationship("RateCard", back_populates="to_zone", foreign_keys="RateCard.to_zone_id")


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)

    zone = relationship("Zone", back_populates="areas")
    pickup_orders = relationship("Order", back_populates="pickup_area", foreign_keys="Order.pickup_area_id")
    dropoff_orders = relationship("Order", back_populates="drop_area", foreign_keys="Order.drop_area_id")


class DeliveryAgent(Base):
    __tablename__ = "delivery_agents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    current_zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True, index=True)
    availability_status = Column(SQLEnum(AgentAvailability), default=AgentAvailability.AVAILABLE, index=True)
    vehicle_type = Column(SQLEnum(VehicleType), default=VehicleType.BIKE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="agent_profile")
    current_zone = relationship("Zone", back_populates="agents", foreign_keys=[current_zone_id])
    orders = relationship("Order", back_populates="assigned_agent", foreign_keys="Order.assigned_agent_id")


class RateCard(Base):
    __tablename__ = "rate_cards"

    id = Column(Integer, primary_key=True, index=True)
    order_type = Column(SQLEnum(OrderType), nullable=False)
    from_zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    to_zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    base_rate = Column(Float, nullable=False)       # Fixed base charge
    rate_per_kg = Column(Float, nullable=False)     # Per kg charge
    cod_surcharge = Column(Float, default=0.0)      # COD extra charge
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    from_zone = relationship("Zone", back_populates="pickup_rate_cards", foreign_keys=[from_zone_id])
    to_zone = relationship("Zone", back_populates="dropoff_rate_cards", foreign_keys=[to_zone_id])


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customer_profiles.id"), nullable=False)

    pickup_address = Column(Text, nullable=False)
    pickup_area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    pickup_zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)

    drop_address = Column(Text, nullable=False)
    drop_area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    drop_zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)

    # Package dimensions
    length = Column(Float, nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)
    actual_weight = Column(Float, nullable=False)
    volumetric_weight = Column(Float, nullable=False)
    chargeable_weight = Column(Float, nullable=False)

    order_type = Column(SQLEnum(OrderType), nullable=False)
    payment_type = Column(SQLEnum(PaymentType), nullable=False)

    base_charge = Column(Float, nullable=False, default=0.0)
    cod_surcharge = Column(Float, nullable=False, default=0.0)
    total_charge = Column(Float, nullable=False, default=0.0)

    assigned_agent_id = Column(Integer, ForeignKey("delivery_agents.id"), nullable=True)

    status = Column(SQLEnum(OrderStatus), default=OrderStatus.CREATED, index=True)
    failure_reason = Column(Text, nullable=True)
    reschedule_date = Column(DateTime(timezone=True), nullable=True)
    reschedule_note = Column(Text, nullable=True)

    estimated_delivery_time = Column(DateTime(timezone=True), nullable=True)
    delivery_risk_score = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("CustomerProfile", back_populates="orders", foreign_keys=[customer_id])
    pickup_area = relationship("Area", back_populates="pickup_orders", foreign_keys=[pickup_area_id])
    drop_area = relationship("Area", back_populates="dropoff_orders", foreign_keys=[drop_area_id])
    pickup_zone = relationship("Zone", foreign_keys=[pickup_zone_id])
    drop_zone = relationship("Zone", foreign_keys=[drop_zone_id])
    assigned_agent = relationship("DeliveryAgent", back_populates="orders", foreign_keys=[assigned_agent_id])
    tracking_events = relationship("TrackingEvent", back_populates="order", order_by="TrackingEvent.timestamp")
    notifications = relationship("Notification", back_populates="order")


class TrackingEvent(Base):
    """Immutable append-only tracking history."""
    __tablename__ = "tracking_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    status = Column(SQLEnum(OrderStatus), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)

    order = relationship("Order", back_populates="tracking_events")
    actor = relationship("User", back_populates="tracking_events", foreign_keys=[actor_user_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    type = Column(SQLEnum(NotificationType), default=NotificationType.GENERAL)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])
    order = relationship("Order", back_populates="notifications")
