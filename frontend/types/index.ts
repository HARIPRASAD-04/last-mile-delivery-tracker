export type UserRole = 'ADMIN' | 'CUSTOMER' | 'AGENT';
export type OrderType = 'B2B' | 'B2C';
export type PaymentType = 'PREPAID' | 'COD';
export type AgentAvailability = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type VehicleType = 'BIKE' | 'SCOOTER' | 'VAN' | 'TRUCK';
export type OrderStatus =
  | 'CREATED' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RESCHEDULED' | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface Zone {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

export interface Area {
  id: number;
  name: string;
  postal_code?: string;
  zone_id: number;
  zone?: Zone;
}

export interface RateCard {
  id: number;
  order_type: OrderType;
  from_zone_id: number;
  to_zone_id: number;
  base_rate: number;
  rate_per_kg: number;
  cod_surcharge: number;
  is_active: boolean;
  from_zone?: Zone;
  to_zone?: Zone;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: number;
  user_id: number;
  phone?: string;
  current_latitude?: number;
  current_longitude?: number;
  current_zone_id?: number;
  availability_status: AgentAvailability;
  vehicle_type: VehicleType;
  user?: User;
  current_zone?: Zone;
}

export interface TrackingEvent {
  id: number;
  order_id: number;
  status: OrderStatus;
  timestamp: string;
  actor_user_id?: number;
  description?: string;
  location?: string;
  actor?: User;
}

export interface Order {
  id: number;
  tracking_number: string;
  customer_id: number;
  pickup_address: string;
  pickup_area_id: number;
  pickup_zone_id: number;
  drop_address: string;
  drop_area_id: number;
  drop_zone_id: number;
  length: number;
  width: number;
  height: number;
  actual_weight: number;
  volumetric_weight: number;
  chargeable_weight: number;
  order_type: OrderType;
  payment_type: PaymentType;
  base_charge: number;
  cod_surcharge: number;
  total_charge: number;
  assigned_agent_id?: number;
  status: OrderStatus;
  failure_reason?: string;
  reschedule_date?: string;
  reschedule_note?: string;
  estimated_delivery_time?: string;
  delivery_risk_score: number;
  created_at: string;
  updated_at: string;
  customer?: { id: number; name: string; email: string; phone?: string };
  pickup_area?: Area;
  drop_area?: Area;
  pickup_zone?: Zone;
  drop_zone?: Zone;
  assigned_agent?: Agent;
  tracking_events?: TrackingEvent[];
  intelligence?: DeliveryIntelligence;
}

export interface DeliveryIntelligence {
  eta_from: string;
  eta_to: string;
  risk_score: number;
  risk_category: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  risk_factors: string[];
  positive_factors: string[];
}

export interface PriceBreakdown {
  pickup_zone: string;
  drop_zone: string;
  pickup_zone_id: number;
  drop_zone_id: number;
  is_intra_zone: boolean;
  actual_weight: number;
  volumetric_weight: number;
  chargeable_weight: number;
  base_rate: number;
  rate_per_kg: number;
  weight_charge: number;
  base_charge: number;
  cod_surcharge: number;
  total_charge: number;
}

export interface Notification {
  id: number;
  user_id: number;
  order_id?: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminDashboard {
  total_orders: number;
  active_deliveries: number;
  delivered_today: number;
  failed_deliveries: number;
  available_agents: number;
  total_revenue: number;
  orders_by_status: Record<string, number>;
  orders_by_zone: Record<string, number>;
}

export interface ControlTowerSummary {
  active_deliveries: number;
  at_risk_deliveries: number;
  high_risk_deliveries: number;
  failed_deliveries: number;
  available_agents: number;
  busy_agents: number;
}


export interface ControlTowerSummary {
  active_deliveries: number;
  at_risk_deliveries: number;
  high_risk_deliveries: number;
  failed_deliveries: number;
  available_agents: number;
  busy_agents: number;
}

