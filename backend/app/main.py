from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.connection import create_tables
from app.api import auth, orders, admin, agent, notifications

app = FastAPI(
    title="Last-Mile Delivery Tracker API",
    description="""
    ## Last-Mile Delivery Management Platform
    
    A production-grade delivery management system with:
    - **Role-based authentication** (Customer, Agent, Admin)
    - **Smart pricing engine** with zone-based rate cards
    - **Intelligent agent assignment** using Haversine distance
    - **Immutable tracking history** with append-only events
    - **Smart Delivery Intelligence** — ETA + Risk Scoring
    - **Notification system** with email abstraction
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(agent.router)
app.include_router(notifications.router)


@app.on_event("startup")
async def startup():
    create_tables()


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "running",
        "app": "Last-Mile Delivery Tracker",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
