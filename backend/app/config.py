from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./delivery.db"
    JWT_SECRET: str = "supersecretjwtkey_changeme_in_production_32chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:3000"
    RESEND_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@lastmiledelivery.com"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
