from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.models import (
    UserRole, AgentAvailability, VehicleType,
    OrderType, PaymentType, OrderStatus, NotificationType
)


# ─── Auth / User ─────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    address: Optional[str] = None  # for customer profile


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Zone / Area ─────────────────────────────────────────────────────────────

class ZoneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = None
    is_active: bool = True


class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ZoneOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class AreaCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    postal_code: Optional[str] = None
    zone_id: int


class AreaUpdate(BaseModel):
    name: Optional[str] = None
    postal_code: Optional[str] = None
    zone_id: Optional[int] = None


class AreaOut(BaseModel):
    id: int
    name: str
    postal_code: Optional[str] = None
    zone_id: int
    zone: Optional[ZoneOut] = None

    model_config = {"from_attributes": True}


# ─── Rate Card ───────────────────────────────────────────────────────────────

class RateCardCreate(BaseModel):
    order_type: OrderType
    from_zone_id: int
    to_zone_id: int
    base_rate: float = Field(..., ge=0)
    rate_per_kg: float = Field(..., ge=0)
    cod_surcharge: float = Field(default=0.0, ge=0)
    is_active: bool = True


class RateCardUpdate(BaseModel):
    base_rate: Optional[float] = None
    rate_per_kg: Optional[float] = None
    cod_surcharge: Optional[float] = None
    is_active: Optional[bool] = None


class RateCardOut(BaseModel):
    id: int
    order_type: OrderType
    from_zone_id: int
    to_zone_id: int
    base_rate: float
    rate_per_kg: float
    cod_surcharge: float
    is_active: bool
    from_zone: Optional[ZoneOut] = None
    to_zone: Optional[ZoneOut] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Pricing ─────────────────────────────────────────────────────────────────

class PriceCalculationRequest(BaseModel):
    pickup_area_id: int
    drop_area_id: int
    length: float = Field(..., gt=0)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    actual_weight: float = Field(..., gt=0)
    order_type: OrderType
    payment_type: PaymentType


class PriceBreakdown(BaseModel):
    pickup_zone: str
    drop_zone: str
    pickup_zone_id: int
    drop_zone_id: int
    is_intra_zone: bool
    actual_weight: float
    volumetric_weight: float
    chargeable_weight: float
    base_rate: float
    rate_per_kg: float
    weight_charge: float
    base_charge: float
    cod_surcharge: float
    total_charge: float


# ─── Delivery Agent ───────────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    user_id: int
    phone: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    current_zone_id: Optional[int] = None
    availability_status: AgentAvailability = AgentAvailability.AVAILABLE
    vehicle_type: VehicleType = VehicleType.BIKE


class AgentUpdate(BaseModel):
    phone: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    current_zone_id: Optional[int] = None
    vehicle_type: Optional[VehicleType] = None


class AgentAvailabilityUpdate(BaseModel):
    availability_status: AgentAvailability


class AgentLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    zone_id: Optional[int] = None


class AgentOut(BaseModel):
    id: int
    user_id: int
    phone: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    current_zone_id: Optional[int] = None
    availability_status: AgentAvailability
    vehicle_type: VehicleType
    user: Optional[UserOut] = None
    current_zone: Optional[ZoneOut] = None

    model_config = {"from_attributes": True}


# ─── Tracking Event ──────────────────────────────────────────────────────────

class TrackingEventOut(BaseModel):
    id: int
    order_id: int
    status: OrderStatus
    timestamp: datetime
    actor_user_id: Optional[int] = None
    description: Optional[str] = None
    location: Optional[str] = None
    actor: Optional[UserOut] = None

    model_config = {"from_attributes": True}


# ─── Order ───────────────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    pickup_address: str
    pickup_area_id: int
    drop_address: str
    drop_area_id: int
    length: float = Field(..., gt=0)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    actual_weight: float = Field(..., gt=0)
    order_type: OrderType
    payment_type: PaymentType
    customer_id: Optional[int] = None  # Admin can specify; customer uses own ID


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    description: Optional[str] = None
    location: Optional[str] = None


class FailedDeliveryUpdate(BaseModel):
    failure_reason: str
    description: Optional[str] = None


class RescheduleRequest(BaseModel):
    reschedule_date: datetime
    note: Optional[str] = None


class ManualAssignRequest(BaseModel):
    agent_id: int


class OrderOut(BaseModel):
    id: int
    tracking_number: str
    customer_id: int
    pickup_address: str
    pickup_area_id: int
    pickup_zone_id: int
    drop_address: str
    drop_area_id: int
    drop_zone_id: int
    length: float
    width: float
    height: float
    actual_weight: float
    volumetric_weight: float
    chargeable_weight: float
    order_type: OrderType
    payment_type: PaymentType
    base_charge: float
    cod_surcharge: float
    total_charge: float
    assigned_agent_id: Optional[int] = None
    status: OrderStatus
    failure_reason: Optional[str] = None
    reschedule_date: Optional[datetime] = None
    reschedule_note: Optional[str] = None
    estimated_delivery_time: Optional[datetime] = None
    delivery_risk_score: int
    created_at: datetime
    updated_at: datetime

    # Expanded relations
    customer: Optional[dict] = None
    pickup_area: Optional[AreaOut] = None
    drop_area: Optional[AreaOut] = None
    pickup_zone: Optional[ZoneOut] = None
    drop_zone: Optional[ZoneOut] = None
    assigned_agent: Optional[AgentOut] = None
    tracking_events: Optional[List[TrackingEventOut]] = None

    model_config = {"from_attributes": True}


class OrderListOut(BaseModel):
    id: int
    tracking_number: str
    customer_id: int
    pickup_address: str
    pickup_zone_id: int
    drop_address: str
    drop_zone_id: int
    order_type: OrderType
    payment_type: PaymentType
    total_charge: float
    assigned_agent_id: Optional[int] = None
    status: OrderStatus
    estimated_delivery_time: Optional[datetime] = None
    delivery_risk_score: int
    created_at: datetime
    pickup_zone: Optional[ZoneOut] = None
    drop_zone: Optional[ZoneOut] = None
    assigned_agent: Optional[AgentOut] = None
    customer: Optional[dict] = None

    model_config = {"from_attributes": True}


# ─── Notification ────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    user_id: int
    order_id: Optional[int] = None
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Dashboard ───────────────────────────────────────────────────────────────

class AdminDashboard(BaseModel):
    total_orders: int
    active_deliveries: int
    delivered_today: int
    failed_deliveries: int
    available_agents: int
    total_revenue: float
    orders_by_status: dict
    orders_by_zone: dict


class CustomerDashboard(BaseModel):
    total_orders: int
    active_orders: int
    delivered: int
    failed: int


class AgentDashboard(BaseModel):
    today_deliveries: int
    completed: int
    pending: int
    failed: int
