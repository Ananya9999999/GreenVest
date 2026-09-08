import os
from functools import lru_cache
from typing import Dict, Any, List

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    from pydantic import BaseModel as BaseSettings
    SettingsConfigDict = None


class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "greenvest-dev-secret-key-change-in-production-2026")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./greenvest.db")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

    # Razorpay Payment Gateway Configuration
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_greenvest2026")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "secret_greenvest_live2026")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "whsec_greenvest_webhook_2026")

    # Direct UPI / GPay Payment Configuration
    UPI_ID: str = os.getenv("UPI_ID", "imananya07@okhdfcbank")
    UPI_PAYEE_NAME: str = os.getenv("UPI_PAYEE_NAME", "Ananya Singla - GreenVest")

    # Pricing Plans (in INR)
    PLANS: Dict[str, Dict[str, Any]] = {
        "landowner_listing": {
            "name": "Landowner Listing Pass",
            "price_inr": 1999.0,
            "description": "Publish verified parcels with unique LandIDs and automated Land Health certification.",
        },
        "corporate_access": {
            "name": "Corporate Access Pass",
            "price_inr": 9999.0,
            "description": "Full access to browse verified marketplace land inventory and direct messaging with owners.",
        },
    }

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

