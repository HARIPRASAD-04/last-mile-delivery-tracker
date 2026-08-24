# LastMile Delivery Tracker

A production-quality **Last-Mile Delivery Management Platform** with three roles: Customer, Delivery Agent, and Admin.

---

## Features

### Core
- **Role-Based Authentication** — JWT with CUSTOMER / AGENT / ADMIN roles
- **Delivery Pricing Engine** — Volumetric weight, B2B/B2C rates, COD surcharges, intra/inter-zone
- **Smart Agent Assignment** — Haversine-based nearest agent with zone-preference fallback
- **Immutable Tracking** — Append-only event log with validated status transitions
- **Failed Delivery + Rescheduling** — Full fail flow with customer-initiated reschedule and auto-reassignment
- **In-App Notifications** — Every status change notifies customer; ASSIGNED also notifies agent

### USP: Smart Delivery Intelligence
Deterministic logistics scoring (0–100 risk score) per order. Not ML — fully reproducible from known order attributes.
- Prior failed attempts (+30 each)
- Inter-zone routing (+10–20)
- No agent assigned (+20)
- Order pending > 24h (+15)
- COD payment (+5)
- Confidence % = 100 − score

### Admin Panel
- KPI dashboard with Recharts
- Full order management (filter/search/paginate)
- Manual + auto agent assignment
- Zone / Area / Rate Card CRUD with soft-delete

### Agent App
- Personal delivery queue with status progression
- Availability toggle (AVAILABLE / BUSY / OFFLINE)
- One-click fail with reason capture

### Customer Portal
- Create delivery with real-time price preview
- Public order tracking by tracking number
- Reschedule failed deliveries

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Seed the database with comprehensive demo data
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

**API Docs (Swagger):** http://localhost:8000/docs  
**ReDoc:** http://localhost:8000/redoc

### Frontend

```bash
cd frontend
npm install
npm run dev
```

**App:** http://localhost:3000

---

## Demo Credentials

| Role     | Email                 | Password    |
|----------|-----------------------|-------------|
| Admin    | admin@demo.com        | admin123    |
| Customer | customer@demo.com     | customer123 |
| Agent 1  | agent1@demo.com       | agent123    |
| Agent 2  | agent2@demo.com       | agent123    |
| Agent 3  | agent3@demo.com       | agent123    |
| Agent 4  | agent4@demo.com       | agent123    |
| Agent 5  | agent5@demo.com       | agent123    |

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend   | FastAPI, SQLAlchemy, Pydantic v2    |
| Database  | SQLite (local) / PostgreSQL (prod)  |
| Auth      | JWT (python-jose), bcrypt           |
| Charts    | Recharts                            |
| Email     | Resend API (optional, falls back to log) |

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=sqlite:///./delivery.db
JWT_SECRET=your-very-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
# Optional — if not set, emails are logged only
RESEND_API_KEY=
FROM_EMAIL=noreply@yourdomain.com
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Architecture

```
last-mile-delivery-tracker/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (thin — no business logic)
│   │   │   ├── auth.py           # Register, login, me
│   │   │   ├── orders.py         # Full order lifecycle
│   │   │   ├── admin.py          # Dashboard, zones, areas, rates, agents
│   │   │   ├── agent.py          # Agent profile, orders, availability
│   │   │   └── notifications.py  # In-app notification management
│   │   ├── auth/         # JWT helpers, role guards
│   │   ├── models/       # SQLAlchemy models + enums
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # All business logic
│   │   │   ├── pricing.py               # Rate calculation engine
│   │   │   ├── assignment.py            # Agent assignment (Haversine)
│   │   │   ├── tracking.py              # Immutable tracking events
│   │   │   ├── notification.py          # In-app + email notifications
│   │   │   └── delivery_intelligence.py # ETA + deterministic risk scoring
│   │   └── main.py
│   ├── tests/
│   │   └── test_all.py   # 38 unit tests
│   ├── seed.py           # Comprehensive demo data
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/       # Login, Register
│   │   ├── admin/        # Admin dashboard + all management pages
│   │   ├── customer/     # Customer dashboard + pages
│   │   └── agent/        # Agent dashboard + pages
│   ├── components/
│   │   ├── ui/           # Shared UI components (Button, Input, etc.)
│   │   ├── layout/       # Sidebar, DashboardLayout
│   │   └── orders/       # TrackingTimeline, DeliveryIntelligence
│   ├── lib/
│   │   ├── api.ts        # Centralized API client
│   │   ├── auth-context.tsx  # JWT auth context with role helpers
│   │   └── utils.ts      # Formatters, color maps, helpers
│   └── types/
│       └── index.ts      # TypeScript types for all entities
│
├── README.md
└── SYSTEM_DESIGN.md      # Technical architecture deep-dive
```

---

## Business Logic

### Pricing Engine (`services/pricing.py`)
1. Look up `pickup_area → pickup_zone` and `drop_area → drop_zone` via FK
2. `volumetric_weight = (L × W × H) / 5000`
3. `chargeable_weight = max(actual_weight, volumetric_weight)`
4. Query `RateCard` by `(from_zone, to_zone, order_type, is_active=True)`
5. `charge = base_rate + (chargeable_weight × rate_per_kg)`
6. `cod_surcharge` applied only if `payment_type == COD` (from rate card row)
7. `total = charge + cod_surcharge`

All rates come from the database. Zero hardcoded pricing in business logic.

### Agent Assignment (`services/assignment.py`)
1. Filter agents where `availability_status = AVAILABLE`
2. Score each: `zone_penalty (0 if same zone, else 100) + haversine_distance(km)`
3. Sort by score ascending; assign the lowest score
4. Fall back gracefully if no GPS coords available

### Status Transitions (`services/tracking.py`)
```
CREATED → ASSIGNED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
      ↘ FAILED ← (from ASSIGNED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY)
                    ↓
               RESCHEDULED → ASSIGNED → ...
```
- Every status change calls `update_order_status()` which atomically updates `order.status` AND inserts a new `TrackingEvent`
- No endpoint exposes DELETE or UPDATE on `tracking_events`
- Admin override bypasses validation but still creates an immutable event

### Failed Delivery Flow
1. Agent POSTs `/api/orders/{id}/fail` with `failure_reason`
2. Order status → `FAILED`, tracking event created, agent freed
3. Customer notified in-app
4. Customer POSTs `/api/orders/{id}/reschedule` with `reschedule_date`
5. Order status → `RESCHEDULED`, nearest agent auto-assigned
6. If agent found: status → `ASSIGNED`, tracking event created, agent notified

### Smart Delivery Intelligence (`services/delivery_intelligence.py`)
- **Risk Score (0–100):** Deterministic. Failed attempts (+30 each), zone distance (+10–20), no agent (+20), pending > 24h (+15), COD (+5). Capped at 100.
- **Confidence:** `100 − risk_score`
- **ETA:** `now + status_base_minutes + zone_penalty_minutes + (60 × failed_attempts)`

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

**38 tests, 38 pass (0 failures)**

Coverage:
- `TestPricingService` (7) — volumetric weight, chargeable weight, B2B/B2C, COD, PREPAID
- `TestAssignmentService` (5) — Haversine, zone preference, busy exclusion, nearest selection
- `TestTrackingService` (9) — all valid transitions, invalid transitions, admin override
- `TestReschedulingLogic` (4) — fail/reschedule rules
- `TestTrackingImmutability` (3) — **proves previous events are untouched after status update**
- `TestPricingEdgeCases` (6) — zero dimensions, equal weights, formula correctness, COD/PREPAID enforcement
- `TestStatusMachineCompleteness` (4) — all statuses in graph, terminal states, descriptions exist

---

## Database Schema

Key constraints and indexes:
- `users.email` — UNIQUE + INDEX
- `orders.tracking_number` — UNIQUE + INDEX
- `orders.status` — INDEX (for dashboard filter queries)
- `delivery_agents.availability_status` — INDEX (for assignment queries)
- `tracking_events.order_id` — INDEX (for order history lookups)
- All relationships use proper FK constraints
- SQLite: `PRAGMA foreign_keys=ON` enforced at connection

---

## Deployment

### Docker (Optional)

```bash
docker-compose up
```

Starts backend on :8000 and frontend on :3000.

### Production Checklist
- Change `JWT_SECRET` to a secure random value
- Set `DATABASE_URL` to a PostgreSQL connection string
- Set `RESEND_API_KEY` for real email delivery
- Set `NEXT_PUBLIC_API_URL` to your deployed API URL
- Run `npm run build` for the frontend production bundle

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/auth/me` | Any | Current user info |
| POST | `/api/orders/calculate` | — | Preview price |
| POST | `/api/orders` | Customer/Admin | Create order |
| GET | `/api/orders` | Any | List own orders |
| GET | `/api/orders/{id}` | Any | Order detail + intelligence |
| PATCH | `/api/orders/{id}/status` | Agent/Admin | Update status |
| POST | `/api/orders/{id}/fail` | Agent/Admin | Mark failed |
| POST | `/api/orders/{id}/reschedule` | Customer/Admin | Reschedule |
| POST | `/api/orders/{id}/assign` | Admin | Manual assign |
| POST | `/api/orders/{id}/auto-assign` | Admin | Auto assign |
| GET | `/api/orders/track/{tracking_number}` | — | Public tracking |
| GET | `/api/admin/dashboard` | Admin | KPI stats |
| GET/POST/PATCH | `/api/admin/zones` | Admin | Zone CRUD |
| GET/POST/PATCH | `/api/admin/areas` | Admin | Area CRUD |
| GET/POST/PATCH/DELETE | `/api/admin/rates` | Admin | Rate card CRUD |
| GET/POST/PATCH | `/api/admin/agents` | Admin | Agent management |
| GET/PATCH | `/api/agent/availability` | Agent | Toggle availability |
| GET | `/api/agent/orders` | Agent | Assigned orders |
| GET/PATCH | `/api/notifications` | Any | In-app notifications |
