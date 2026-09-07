"""Database schema: Users, Parcels, Scores, Strategies, Preferences, Marketplace."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)  # public UserID
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    parcels = relationship("Parcel", back_populates="owner", cascade="all, delete-orphan")
    preferences = relationship(
        "UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    strategies = relationship("Strategy", back_populates="user", cascade="all, delete-orphan")


class Parcel(Base):
    __tablename__ = "parcels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    land_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)  # public LandID
    owner_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True, index=True
    )
    location: Mapped[str] = mapped_column(String(255))
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    area_hectares: Mapped[float] = mapped_column(Float)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_marketplace: Mapped[bool] = mapped_column(Boolean, default=False)
    listing_price: Mapped[float | None] = mapped_column(Float, nullable=True)  # INR per acre or total
    status: Mapped[str] = mapped_column(String(32), default="active")  # active | sold | draft
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    owner = relationship("User", back_populates="parcels")
    scores = relationship(
        "LandScore", back_populates="parcel", uselist=False, cascade="all, delete-orphan"
    )
    strategies = relationship("Strategy", back_populates="parcel", cascade="all, delete-orphan")


class LandScore(Base):
    __tablename__ = "land_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    parcel_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("parcels.id"), unique=True, index=True
    )
    health_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0–100
    soil_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    water_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    climate_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    vegetation_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    terrain_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    climate_risk: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0–10
    carbon_potential: Mapped[float | None] = mapped_column(Float, nullable=True)  # tCO2e/ha/yr
    soil_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    parcel = relationship("Parcel", back_populates="scores")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), unique=True, index=True
    )
    carbon: Mapped[float] = mapped_column(Float, default=5.0)
    roi: Mapped[float] = mapped_column(Float, default=5.0)
    low_risk: Mapped[float] = mapped_column(Float, default=5.0)
    biodiversity: Mapped[float] = mapped_column(Float, default=5.0)
    water_efficiency: Mapped[float] = mapped_column(Float, default=5.0)
    budget: Mapped[float | None] = mapped_column(Float, nullable=True)
    investment_horizon_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    user = relationship("User", back_populates="preferences")


class Strategy(Base):
    __tablename__ = "strategies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    parcel_id: Mapped[str] = mapped_column(String(36), ForeignKey("parcels.id"), index=True)
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True, index=True
    )
    strategy_type: Mapped[str] = mapped_column(String(32))  # maximum_carbon | maximum_roi | balanced
    title: Mapped[str] = mapped_column(String(128))
    approach: Mapped[str] = mapped_column(String(255))
    recommended_species: Mapped[str] = mapped_column(Text)  # JSON list as text
    carbon_potential_tco2e_per_ha: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_investment: Mapped[float] = mapped_column(Float, default=0.0)
    expected_roi_percent: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(32), default="Medium")
    rank_score: Mapped[float] = mapped_column(Float, default=0.0)
    rank: Mapped[int] = mapped_column(Integer, default=0)
    is_selected: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    parcel = relationship("Parcel", back_populates="strategies")
    user = relationship("User", back_populates="strategies")


class InvestmentCalculation(Base):
    """Persisted investment cost + ROI runs for audit / history."""

    __tablename__ = "investment_calculations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    parcel_id: Mapped[str] = mapped_column(String(36), ForeignKey("parcels.id"), index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    strategy_type: Mapped[str] = mapped_column(String(32))
    land_cost: Mapped[float] = mapped_column(Float, default=0.0)
    plantation_cost: Mapped[float] = mapped_column(Float, default=0.0)
    saplings_cost: Mapped[float] = mapped_column(Float, default=0.0)
    labour_cost: Mapped[float] = mapped_column(Float, default=0.0)
    irrigation_cost: Mapped[float] = mapped_column(Float, default=0.0)
    maintenance_annual: Mapped[float] = mapped_column(Float, default=0.0)
    total_investment: Mapped[float] = mapped_column(Float, default=0.0)
    expected_roi_percent: Mapped[float] = mapped_column(Float, default=0.0)
    break_even_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
