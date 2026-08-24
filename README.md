# 🚚 LastMile Delivery Tracker

A production-quality **Last-Mile Delivery Management Platform** with three roles: Customer, Delivery Agent, and Admin.

## ✨ Features

### Core
- **Role-Based Authentication** — JWT with CUSTOMER / AGENT / ADMIN roles
- **Delivery Pricing Engine** — Volumetric weight, B2B/B2C rates, COD surcharges, intra/inter-zone pricing
- **Smart Agent Assignment** — Haversine-based nearest agent search with zone-preference fallback
- **Immutable Tracking** — Append-only event log with validated status transitions
- **Failed Delivery + Rescheduling** — Full agent failure flow with customer-initiated reschedule
- **In-App Notifications** — Status change notifications with read/unread state

### USP: Smart Delivery Intelligence 🧠
Deterministic ETA estimation and 0–100 risk scoring per order, accounting for:
- Payment type (COD = higher risk)
- Zone routing (inter-zone delays)
- Chargeable weight
- Delivery attempt history

### Admin Panel
- KPI dashboard with live charts (Recharts)
- Full order management (filter/search/paginate)
- Manual + auto agent assignment
- Zone / Area / Rate Card CRUD

### Agent App
- Personal delivery queue with status progression
- One-click fail/complete flows
- Availability toggle

### Customer Portal
- Create delivery with real-time price preview
- Track any order by tracking number
- Reschedule failed deliveries

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Seed the database with demo data
python seed.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

**API Docs:** http://localhost:8000/docs  
**ReDoc:** http://localhost:8000/redoc

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

**App:** http://localhost:3000

---

## 🔐 Demo Credentials

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@demo.com         | admin123     |
| Customer | customer@demo.com      | customer123  |
| Agent 1  | agent1@demo.com        | agent123     |
| Agent 2  | agent2@demo.com        | agent123     |

---

## 🧪 Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

All 25 tests pass covering:
- Pricing (volumetric weight, COD surcharge, intra/inter-zone)
- Assignment (Haversine distance, zone preference, busy agent exclusion)
- Status transitions (valid/invalid/admin override)
- Rescheduling logic

---

## 🏗️ Architecture

```
last-mile-delivery-tracker/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   │   ├── auth.py
│   │   │   ├── orders.py
│   │   │   ├── admin.py
│   │   │   ├── agent.py
│   │   │   └── notifications.py
│   │   ├── auth/         # JWT helpers
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   │   ├── pricing.py              # Rate calculation engine
│   │   │   ├── assignment.py           # Agent assignment (Haversine)
│   │   │   ├── tracking.py             # Immutable tracking events
│   │   │   ├── notification.py         # In-app notifications
│   │   │   └── delivery_intelligence.py # ETA + risk scoring
│   │   └── main.py
│   ├── tests/
│   │   └── test_all.py   # 25 unit tests
│   ├── seed.py           # Demo data
│   └── requirements.txt
│
└── frontend/
    ├── app/
    │   ├── (auth)/       # Login, Register
    │   ├── admin/        # Admin dashboard + pages
    │   ├── customer/     # Customer dashboard + pages
    │   └── agent/        # Agent dashboard + pages
    ├── components/
    │   ├── ui/           # Shared UI components
    │   ├── layout/       # Sidebar, DashboardLayout
    │   └── orders/       # TrackingTimeline, DeliveryIntelligence
    ├── lib/
    │   ├── api.ts        # API client
    │   ├── auth-context.tsx
    │   └── utils.ts
    └── types/
        └── index.ts      # TypeScript types
```

---

## 🧠 Business Logic

### Pricing Engine
```
volumetric_weight = (L × W × H) / 5000
chargeable_weight = max(actual_weight, volumetric_weight)
charge = base_rate + (chargeable_weight × rate_per_kg) + cod_surcharge
```

### Agent Assignment
1. Filter `AVAILABLE` agents
2. Prefer agents in same zone as pickup
3. Among same-zone agents, pick nearest by Haversine distance
4. If no same-zone agent, pick globally nearest

### Status Flow
```
CREATED → ASSIGNED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                                                ↘ FAILED → RESCHEDULED → ASSIGNED → ...
```
Admins can override any transition. All transitions create immutable tracking events.

### Delivery Intelligence
- **Risk Score (0–100):** COD (+20), inter-zone (+15), heavy package (+10), repeat failure (+25)
- **Confidence (0–100):** Inverse of risk score with adjustments
- **ETA:** Current time + base window (intra: 4–6h, inter: 8–24h) + weight delay

---

## 🐳 Docker (Optional)

```bash
docker-compose up
```

This starts:
- `backend` on port 8000
- `frontend` on port 3000

---

## 📝 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=sqlite:///./delivery.db
SECRET_KEY=your-very-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
