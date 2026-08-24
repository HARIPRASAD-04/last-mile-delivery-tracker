from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, UserRole, CustomerProfile
from app.schemas.schemas import UserRegister, UserLogin, UserOut, TokenResponse
from app.auth.jwt import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new customer account."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    db.flush()

    # Create customer profile
    profile = CustomerProfile(user_id=user.id, address=payload.address)
    db.add(profile)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Login and receive JWT token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user)
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return UserOut.model_validate(current_user)
