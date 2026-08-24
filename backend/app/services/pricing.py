"""
PricingService — Rate calculation engine.

Steps:
1. Detect pickup zone from pickup area
2. Detect drop zone from drop area
3. Calculate volumetric weight: (L x W x H) / 5000
4. Chargeable weight: max(actual, volumetric)
5. Find matching rate card (intra or inter zone, B2B or B2C)
6. Apply COD surcharge if payment_type == COD
7. Return detailed breakdown
"""
from sqlalchemy.orm import Session
from app.models.models import Area, RateCard, OrderType, PaymentType
from app.schemas.schemas import PriceBreakdown
from fastapi import HTTPException


def calculate_delivery_charge(
    db: Session,
    pickup_area_id: int,
    drop_area_id: int,
    length: float,
    width: float,
    height: float,
    actual_weight: float,
    order_type: OrderType,
    payment_type: PaymentType,
) -> PriceBreakdown:
    """
    Core pricing engine. Returns a full price breakdown.
    Raises HTTPException if zone or rate card not found.
    """
    # Step 1 & 2: Detect zones
    pickup_area = db.query(Area).filter(Area.id == pickup_area_id).first()
    if not pickup_area:
        raise HTTPException(status_code=400, detail=f"Pickup area {pickup_area_id} not found")

    drop_area = db.query(Area).filter(Area.id == drop_area_id).first()
    if not drop_area:
        raise HTTPException(status_code=400, detail=f"Drop area {drop_area_id} not found")

    pickup_zone = pickup_area.zone
    drop_zone = drop_area.zone

    if not pickup_zone or not pickup_zone.is_active:
        raise HTTPException(status_code=400, detail="Pickup zone is not active")
    if not drop_zone or not drop_zone.is_active:
        raise HTTPException(status_code=400, detail="Drop zone is not active")

    # Step 3: Volumetric weight
    volumetric_weight = round((length * width * height) / 5000.0, 3)

    # Step 4: Chargeable weight
    chargeable_weight = max(actual_weight, volumetric_weight)

    is_intra_zone = pickup_zone.id == drop_zone.id

    # Step 5: Find rate card
    rate_card = db.query(RateCard).filter(
        RateCard.from_zone_id == pickup_zone.id,
        RateCard.to_zone_id == drop_zone.id,
        RateCard.order_type == order_type,
        RateCard.is_active == True,
    ).first()

    if not rate_card:
        # Try reverse direction for intra-zone (symmetric)
        if is_intra_zone:
            raise HTTPException(
                status_code=400,
                detail=f"No active rate card configured for {order_type} in {pickup_zone.code}"
            )
        raise HTTPException(
            status_code=400,
            detail=f"No active rate card configured for {order_type} from {pickup_zone.code} to {drop_zone.code}"
        )

    # Step 6: Calculate charges
    weight_charge = round(chargeable_weight * rate_card.rate_per_kg, 2)
    base_charge = round(rate_card.base_rate + weight_charge, 2)

    # Step 7: COD surcharge
    cod_surcharge = 0.0
    if payment_type == PaymentType.COD:
        cod_surcharge = round(rate_card.cod_surcharge, 2)

    total_charge = round(base_charge + cod_surcharge, 2)

    return PriceBreakdown(
        pickup_zone=pickup_zone.code,
        drop_zone=drop_zone.code,
        pickup_zone_id=pickup_zone.id,
        drop_zone_id=drop_zone.id,
        is_intra_zone=is_intra_zone,
        actual_weight=actual_weight,
        volumetric_weight=volumetric_weight,
        chargeable_weight=chargeable_weight,
        base_rate=rate_card.base_rate,
        rate_per_kg=rate_card.rate_per_kg,
        weight_charge=weight_charge,
        base_charge=base_charge,
        cod_surcharge=cod_surcharge,
        total_charge=total_charge,
    )
