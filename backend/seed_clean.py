"""
Seed script ??? creates comprehensive demo data.

Usage: python seed.py

Creates:
- 1 admin, 1 customer, 5 agents
- 4 zones, 12 areas
- B2B + B2C rate cards (intra + inter zone)
- 8 sample orders in various statuses
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta, timezone
from app.database.connection import SessionLocal, create_tables
from app.models.models import (
    User, UserRole, CustomerProfile, DeliveryAgent, Zone, Area,
    RateCard, Order, TrackingEvent, Notification,
    OrderStatus, OrderType, PaymentType, AgentAvailability,
    VehicleType, NotificationType
)
from app.auth.jwt import hash_password
import random
import string


def generate_tracking_number(suffix: str) -> str:
    return f"LMD-20260824-{suffix}"


def seed():
    create_tables()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("???? Seeding database...")

        # ?????? Zones ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        zones_data = [
            {"name": "Zone Alpha", "code": "ZONE-A", "description": "Central business district"},
            {"name": "Zone Beta", "code": "ZONE-B", "description": "Northern suburbs"},
            {"name": "Zone Charlie", "code": "ZONE-C", "description": "Eastern industrial"},
            {"name": "Zone Delta", "code": "ZONE-D", "description": "Western residential"},
        ]
        zones = []
        for z in zones_data:
            zone = Zone(**z, is_active=True)
            db.add(zone)
            zones.append(zone)
        db.flush()
        print(f"??? Created {len(zones)} zones")

        # ?????? Areas ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        areas_data = [
            # Zone A
            {"name": "Mumbai Central", "postal_code": "400001", "zone_id": zones[0].id},
            {"name": "Churchgate", "postal_code": "400020", "zone_id": zones[0].id},
            {"name": "Fort", "postal_code": "400001", "zone_id": zones[0].id},
            # Zone B
            {"name": "Andheri West", "postal_code": "400058", "zone_id": zones[1].id},
            {"name": "Andheri East", "postal_code": "400069", "zone_id": zones[1].id},
            {"name": "Jogeshwari", "postal_code": "400060", "zone_id": zones[1].id},
            # Zone C
            {"name": "Bandra West", "postal_code": "400050", "zone_id": zones[2].id},
            {"name": "Bandra East", "postal_code": "400051", "zone_id": zones[2].id},
            {"name": "Kurla", "postal_code": "400070", "zone_id": zones[2].id},
            # Zone D
            {"name": "Powai", "postal_code": "400076", "zone_id": zones[3].id},
            {"name": "Ghatkopar", "postal_code": "400077", "zone_id": zones[3].id},
            {"name": "Vikhroli", "postal_code": "400079", "zone_id": zones[3].id},
        ]
        areas = []
        for a in areas_data:
            area = Area(**a)
            db.add(area)
            areas.append(area)
        db.flush()
        print(f"??? Created {len(areas)} areas")

        # ?????? Rate Cards ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        # Intra-zone rates (same zone)
        rate_cards_data = []
        for zone in zones:
            # B2C intra-zone
            rate_cards_data.append({
                "order_type": OrderType.B2C, "from_zone_id": zone.id, "to_zone_id": zone.id,
                "base_rate": 50.0, "rate_per_kg": 15.0, "cod_surcharge": 25.0, "is_active": True
            })
            # B2B intra-zone
            rate_cards_data.append({
                "order_type": OrderType.B2B, "from_zone_id": zone.id, "to_zone_id": zone.id,
                "base_rate": 80.0, "rate_per_kg": 12.0, "cod_surcharge": 0.0, "is_active": True
            })

        # Inter-zone rates
        inter_zone_pairs = [
            (zones[0], zones[1]), (zones[0], zones[2]), (zones[0], zones[3]),
            (zones[1], zones[2]), (zones[1], zones[3]), (zones[2], zones[3]),
        ]
        for from_zone, to_zone in inter_zone_pairs:
            # B2C inter-zone (both directions)
            for fz, tz in [(from_zone, to_zone), (to_zone, from_zone)]:
                rate_cards_data.append({
                    "order_type": OrderType.B2C, "from_zone_id": fz.id, "to_zone_id": tz.id,
                    "base_rate": 80.0, "rate_per_kg": 20.0, "cod_surcharge": 30.0, "is_active": True
                })
                rate_cards_data.append({
                    "order_type": OrderType.B2B, "from_zone_id": fz.id, "to_zone_id": tz.id,
                    "base_rate": 120.0, "rate_per_kg": 18.0, "cod_surcharge": 0.0, "is_active": True
                })

        for rc in rate_cards_data:
            db.add(RateCard(**rc))
        db.flush()
        print(f"??? Created {len(rate_cards_data)} rate cards")

        # ?????? Admin User ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        admin_user = User(
            name="Admin User",
            email="admin@demo.com",
            phone="+91-9900000000",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN,
        )
        db.add(admin_user)
        db.flush()
        print("??? Created admin user: admin@demo.com / admin123")

        # ?????? Customer User ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        customer_user = User(
            name="Priya Sharma",
            email="customer@demo.com",
            phone="+91-9811122333",
            password_hash=hash_password("customer123"),
            role=UserRole.CUSTOMER,
        )
        db.add(customer_user)
        db.flush()
        customer_profile = CustomerProfile(
            user_id=customer_user.id,
            address="12, Marine Drive, Mumbai Central, 400001"
        )
        db.add(customer_profile)
        db.flush()
        print("??? Created customer user: customer@demo.com / customer123")

        # ?????? Agent Users ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        agents_data = [
            {"name": "Rahul Kumar", "email": "agent1@demo.com", "phone": "+91-9800000001",
             "lat": 18.9388, "lon": 72.8354, "zone_idx": 0, "vehicle": VehicleType.BIKE},
            {"name": "Sanjay Patel", "email": "agent2@demo.com", "phone": "+91-9800000002",
             "lat": 19.1136, "lon": 72.8697, "zone_idx": 1, "vehicle": VehicleType.SCOOTER},
            {"name": "Meena Gupta", "email": "agent3@demo.com", "phone": "+91-9800000003",
             "lat": 19.0596, "lon": 72.8295, "zone_idx": 2, "vehicle": VehicleType.BIKE},
            {"name": "Arjun Singh", "email": "agent4@demo.com", "phone": "+91-9800000004",
             "lat": 19.1176, "lon": 72.9060, "zone_idx": 3, "vehicle": VehicleType.VAN},
            {"name": "Kavita Nair", "email": "agent5@demo.com", "phone": "+91-9800000005",
             "lat": 19.0760, "lon": 72.8777, "zone_idx": 2, "vehicle": VehicleType.BIKE},
        ]

        agent_profiles = []
        for i, a in enumerate(agents_data):
            user = User(
                name=a["name"], email=a["email"], phone=a["phone"],
                password_hash=hash_password("agent123"), role=UserRole.AGENT,
            )
            db.add(user)
            db.flush()

            status = AgentAvailability.AVAILABLE if i < 4 else AgentAvailability.BUSY
            agent = DeliveryAgent(
                user_id=user.id,
                phone=a["phone"],
                current_latitude=a["lat"],
                current_longitude=a["lon"],
                current_zone_id=zones[a["zone_idx"]].id,
                availability_status=status,
                vehicle_type=a["vehicle"],
            )
            db.add(agent)
            db.flush()
            agent_profiles.append(agent)
            print(f"??? Created agent: {a['email']} / agent123")

        # ?????? Sample Orders ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        now = datetime.now(timezone.utc)

        def make_order(tracking_suffix, customer_id, pickup_area_idx, drop_area_idx,
                       order_type, payment_type, status, assigned_agent=None,
                       days_ago=0, failure_reason=None):
            pickup_area = areas[pickup_area_idx]
            drop_area = areas[drop_area_idx]
            pickup_zone = zones[[z.id for z in zones].index(pickup_area.zone_id)]
            drop_zone = zones[[z.id for z in zones].index(drop_area.zone_id)]

            is_intra = pickup_zone.id == drop_zone.id
            length, width, height = random.uniform(10, 50), random.uniform(10, 40), random.uniform(5, 30)
            actual_weight = random.uniform(0.5, 10.0)
            vol_weight = round((length * width * height) / 5000, 3)
            chargeable = max(actual_weight, vol_weight)

            # Find rate card
            rc = db.query(RateCard).filter(
                RateCard.from_zone_id == pickup_zone.id,
                RateCard.to_zone_id == drop_zone.id,
                RateCard.order_type == order_type,
                RateCard.is_active == True,
            ).first()

            if not rc:
                rc = db.query(RateCard).filter(
                    RateCard.from_zone_id == pickup_zone.id,
                    RateCard.order_type == order_type,
                    RateCard.is_active == True,
                ).first()

            base_charge = rc.base_rate + (chargeable * rc.rate_per_kg) if rc else 100.0
            cod_sur = (rc.cod_surcharge if rc else 0.0) if payment_type == PaymentType.COD else 0.0
            total = base_charge + cod_sur

            created_time = now - timedelta(days=days_ago, hours=random.randint(0, 8))

            order = Order(
                tracking_number=generate_tracking_number(tracking_suffix),
                customer_id=customer_id,
                pickup_address=f"{pickup_area.name}, {pickup_area.postal_code}",
                pickup_area_id=pickup_area.id,
                pickup_zone_id=pickup_zone.id,
                drop_address=f"{drop_area.name}, {drop_area.postal_code}",
                drop_area_id=drop_area.id,
                drop_zone_id=drop_zone.id,
                length=round(length, 1),
                width=round(width, 1),
                height=round(height, 1),
                actual_weight=round(actual_weight, 2),
                volumetric_weight=vol_weight,
                chargeable_weight=round(chargeable, 3),
                order_type=order_type,
                payment_type=payment_type,
                base_charge=round(base_charge, 2),
                cod_surcharge=round(cod_sur, 2),
                total_charge=round(total, 2),
                assigned_agent_id=assigned_agent.id if assigned_agent else None,
                status=status,
                failure_reason=failure_reason,
                delivery_risk_score=random.randint(10, 80),
                estimated_delivery_time=now + timedelta(hours=3),
                created_at=created_time,
                updated_at=created_time,
            )
            return order

        # Order 1: DELIVERED
        o1 = make_order("AA01", customer_profile.id, 0, 3, OrderType.B2C, PaymentType.PREPAID,
                         OrderStatus.DELIVERED, agent_profiles[0], days_ago=3)
        db.add(o1); db.flush()
        for evt_status, hrs_after, desc in [
            (OrderStatus.CREATED, 0, "Order placed by customer"),
            (OrderStatus.ASSIGNED, 1, f"Assigned to {agents_data[0]['name']}"),
            (OrderStatus.PICKED_UP, 3, f"Package picked up"),
            (OrderStatus.IN_TRANSIT, 5, "In transit to delivery zone"),
            (OrderStatus.OUT_FOR_DELIVERY, 7, "Out for delivery"),
            (OrderStatus.DELIVERED, 9, "Successfully delivered"),
        ]:
            db.add(TrackingEvent(order_id=o1.id, status=evt_status,
                timestamp=o1.created_at + timedelta(hours=hrs_after),
                description=desc, actor_user_id=admin_user.id))

        # Order 2: OUT_FOR_DELIVERY
        o2 = make_order("BB02", customer_profile.id, 3, 6, OrderType.B2B, PaymentType.COD,
                         OrderStatus.OUT_FOR_DELIVERY, agent_profiles[1], days_ago=0)
        db.add(o2); db.flush()
        for evt_status, hrs_after, desc in [
            (OrderStatus.CREATED, 0, "Order placed"),
            (OrderStatus.ASSIGNED, 1, f"Assigned to {agents_data[1]['name']}"),
            (OrderStatus.PICKED_UP, 2, "Package collected from pickup"),
            (OrderStatus.IN_TRANSIT, 3, "In transit"),
            (OrderStatus.OUT_FOR_DELIVERY, 4, "Out for delivery ??? arriving soon"),
        ]:
            db.add(TrackingEvent(order_id=o2.id, status=evt_status,
                timestamp=o2.created_at + timedelta(hours=hrs_after),
                description=desc, actor_user_id=admin_user.id))

        # Order 3: IN_TRANSIT
        o3 = make_order("CC03", customer_profile.id, 6, 9, OrderType.B2C, PaymentType.PREPAID,
                         OrderStatus.IN_TRANSIT, agent_profiles[2], days_ago=0)
        db.add(o3); db.flush()
        for evt_status, hrs_after, desc in [
            (OrderStatus.CREATED, 0, "Order placed"),
            (OrderStatus.ASSIGNED, 1, f"Auto-assigned"),
            (OrderStatus.PICKED_UP, 3, "Picked up from Bandra West"),
            (OrderStatus.IN_TRANSIT, 4, "Package in transit"),
        ]:
            db.add(TrackingEvent(order_id=o3.id, status=evt_status,
                timestamp=o3.created_at + timedelta(hours=hrs_after),
                description=desc, actor_user_id=admin_user.id))

        # Order 4: ASSIGNED
        o4 = make_order("DD04", customer_profile.id, 9, 0, OrderType.B2B, PaymentType.PREPAID,
                         OrderStatus.ASSIGNED, agent_profiles[3], days_ago=0)
        db.add(o4); db.flush()
        for evt_status, hrs_after, desc in [
            (OrderStatus.CREATED, 0, "B2B order placed"),
            (OrderStatus.ASSIGNED, 0.5, f"Agent {agents_data[3]['name']} assigned"),
        ]:
            db.add(TrackingEvent(order_id=o4.id, status=evt_status,
                timestamp=o4.created_at + timedelta(hours=hrs_after),
                description=desc, actor_user_id=admin_user.id))

        # Order 5: FAILED
        o5 = make_order("EE05", customer_profile.id, 3, 6, OrderType.B2C, PaymentType.COD,
                         OrderStatus.FAILED, None, days_ago=1,
                         failure_reason="Customer unavailable")
        db.add(o5); db.flush()
        for evt_status, hrs_after, desc in [
            (OrderStatus.CREATED, 0, "Order placed"),
            (OrderStatus.ASSIGNED, 1, "Agent assigned"),
            (OrderStatus.PICKED_UP, 3, "Package picked up"),
            (OrderStatus.OUT_FOR_DELIVERY, 5, "Out for delivery"),
            (OrderStatus.FAILED, 7, "Customer unavailable at delivery address"),
        ]:
            db.add(TrackingEvent(order_id=o5.id, status=evt_status,
                timestamp=o5.created_at + timedelta(hours=hrs_after),
                description=desc, actor_user_id=admin_user.id))

        # Order 6: RESCHEDULED (after failure)
        o6 = make_order("FF06", customer_profile.id, 9, 3, OrderType.B2C, PaymentType.PREPAID,
                         OrderStatus.RESCHEDULED, agent_profiles[0], days_ago=2)
        o6.reschedule_date = now + timedelta(days=2)
        o6.reschedule_note = "Please call before delivery"
        db.add(o6); db.flush()
        for evt_status, hrs_after, desc in [
            (OrderStatus.CREATED, 0, "Order placed"),
            (OrderStatus.ASSIGNED, 1, "Agent assigned"),
            (OrderStatus.PICKED_UP, 4, "Package picked up"),
            (OrderStatus.IN_TRANSIT, 6, "In transit"),
            (OrderStatus.OUT_FOR_DELIVERY, 8, "Out for delivery"),
            (OrderStatus.FAILED, 10, "Incorrect address provided"),
            (OrderStatus.RESCHEDULED, 12, "Customer rescheduled for 2 days later"),
            (OrderStatus.ASSIGNED, 13, "New agent assigned after reschedule"),
        ]:
            db.add(TrackingEvent(order_id=o6.id, status=evt_status,
                timestamp=o6.created_at + timedelta(hours=hrs_after),
                description=desc, actor_user_id=customer_user.id))

        # Order 7: CREATED (awaiting assignment)
        o7 = make_order("GG07", customer_profile.id, 6, 0, OrderType.B2B, PaymentType.COD,
                         OrderStatus.CREATED, None, days_ago=0)
        db.add(o7); db.flush()
        db.add(TrackingEvent(order_id=o7.id, status=OrderStatus.CREATED,
            timestamp=o7.created_at, description="B2B order awaiting agent assignment",
            actor_user_id=customer_user.id))

        # Order 8: PICKED_UP
        o8 = make_order("HH08", customer_profile.id, 0, 9, OrderType.B2C, PaymentType.PREPAID,
                         OrderStatus.PICKED_UP, agent_profiles[4], days_ago=0)
        db.add(o8); db.flush()
        for evt_status, hrs_after, desc in [
            (OrderStatus.CREATED, 0, "Order placed"),
            (OrderStatus.ASSIGNED, 0.5, "Agent assigned"),
            (OrderStatus.PICKED_UP, 2, "Package picked up from Mumbai Central"),
        ]:
            db.add(TrackingEvent(order_id=o8.id, status=evt_status,
                timestamp=o8.created_at + timedelta(hours=hrs_after),
                description=desc, actor_user_id=admin_user.id))

        db.flush()
        print(f"??? Created 8 sample orders")

        # ?????? Notifications ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        notif_data = [
            (customer_user.id, o1.id, NotificationType.DELIVERED, "Order Delivered! ????",
             f"Your order {o1.tracking_number} was delivered successfully."),
            (customer_user.id, o2.id, NotificationType.OUT_FOR_DELIVERY, "Out for Delivery",
             f"Your order {o2.tracking_number} is out for delivery! Expect it soon."),
            (customer_user.id, o5.id, NotificationType.FAILED, "Delivery Failed",
             f"Delivery for {o5.tracking_number} failed: Customer unavailable. You can reschedule."),
            (customer_user.id, o6.id, NotificationType.RESCHEDULED, "Order Rescheduled",
             f"Your order {o6.tracking_number} has been rescheduled."),
        ]
        for user_id, order_id, notif_type, title, message in notif_data:
            db.add(Notification(
                user_id=user_id, order_id=order_id, type=notif_type,
                title=title, message=message, is_read=False,
            ))

        db.commit()
        print("\n??? Seeding complete!")
        print("\n???? Demo Credentials:")
        print("   Admin:    admin@demo.com     / admin123")
        print("   Customer: customer@demo.com  / customer123")
        print("   Agents:   agent1@demo.com    / agent123")
        print("             agent2@demo.com    / agent123")
        print("             agent3@demo.com    / agent123")
        print("             agent4@demo.com    / agent123")
        print("             agent5@demo.com    / agent123")
        print("\n???? Run backend: uvicorn app.main:app --reload")
        print("???? API Docs:   http://localhost:8000/docs")

    except Exception as e:
        db.rollback()
        print(f"??? Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

