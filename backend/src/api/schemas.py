"""Pydantic request/response schemas for the API layer."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ─── Auth ───────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: Optional[str] = None


class UserOut(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Preferences ────────────────────────────────────────────────────────────

class PreferenceWeightsIn(BaseModel):
    carbon: float = Field(5.0, ge=0, le=10)
    roi: float = Field(5.0, ge=0, le=10)
    low_risk: float = Field(5.0, ge=0, le=10)
    biodiversity: float = Field(5.0, ge=0, le=10)
    water_efficiency: float = Field(5.0, ge=0, le=10)
    budget: Optional[float] = Field(None, ge=0)
    investment_horizon_years: Optional[int] = Field(None, ge=1, le=50)


class PreferenceWeightsOut(PreferenceWeightsIn):
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Land / Parcels ─────────────────────────────────────────────────────────

class LandScoreIn(BaseModel):
    health_score: float = Field(..., ge=0, le=100)
    soil_score: Optional[float] = Field(None, ge=0, le=100)
    water_score: Optional[float] = Field(None, ge=0, le=100)
    climate_score: Optional[float] = Field(None, ge=0, le=100)
    vegetation_score: Optional[float] = Field(None, ge=0, le=100)
    terrain_score: Optional[float] = Field(None, ge=0, le=100)
    climate_risk: Optional[float] = Field(None, ge=0, le=10)
    carbon_potential: Optional[float] = None
    soil_type: Optional[str] = None


class LandScoreOut(LandScoreIn):
    id: str
    parcel_id: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class ParcelCreate(BaseModel):
    location: str
    state: Optional[str] = None
    district: Optional[str] = None
    area_hectares: float = Field(..., gt=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    is_marketplace: bool = False
    listing_price: Optional[float] = None
    scores: Optional[LandScoreIn] = None


class ParcelUpdate(BaseModel):
    location: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    area_hectares: Optional[float] = Field(None, gt=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    is_marketplace: Optional[bool] = None
    listing_price: Optional[float] = None
    status: Optional[str] = None
    scores: Optional[LandScoreIn] = None


class ParcelOut(BaseModel):
    id: str
    land_id: str
    owner_id: Optional[str] = None
    location: str
    state: Optional[str] = None
    district: Optional[str] = None
    area_hectares: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    is_marketplace: bool
    listing_price: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime
    scores: Optional[LandScoreOut] = None

    model_config = {"from_attributes": True}


# ─── Marketplace ────────────────────────────────────────────────────────────

class MarketplaceFilter(BaseModel):
    min_health_score: Optional[float] = None
    max_health_score: Optional[float] = None
    min_carbon_potential: Optional[float] = None
    max_budget: Optional[float] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    state: Optional[str] = None
    district: Optional[str] = None
    sort_by: str = "health_score"  # health_score | carbon_potential | listing_price | area
    sort_order: str = "desc"  # asc | desc
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class MarketplaceListOut(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[ParcelOut]


# ─── Investment Calculator ──────────────────────────────────────────────────

class InvestmentCostRequest(BaseModel):
    land_id: str
    strategy_type: str = Field(..., pattern="^(maximum_carbon|maximum_roi|balanced)$")
    land_cost_override: Optional[float] = None  # if marketplace listing price known
    include_maintenance_years: int = Field(5, ge=0, le=30)


class InvestmentCostBreakdown(BaseModel):
    land_cost: float
    plantation_cost: float
    saplings_cost: float
    labour_cost: float
    irrigation_cost: float
    maintenance_total: float
    total_investment: float
    currency: str = "INR"


class ROIResult(BaseModel):
    expected_roi_percent: float
    annual_return_estimate: float
    break_even_years: Optional[float]
    horizon_years: int
    total_return_estimate: float
    climate_risk_score: Optional[float] = None
    notes: list[str] = []


class InvestmentAnalysisOut(BaseModel):
    land_id: str
    strategy_type: str
    costs: InvestmentCostBreakdown
    returns: ROIResult
    calculation_id: Optional[str] = None


# ─── Strategy (lightweight for persistence) ─────────────────────────────────

class StrategyOut(BaseModel):
    id: str
    parcel_id: str
    strategy_type: str
    title: str
    approach: str
    recommended_species: list[str]
    carbon_potential_tco2e_per_ha: float
    estimated_investment: float
    expected_roi_percent: float
    risk_level: str
    rank_score: float
    rank: int
    is_selected: bool

    model_config = {"from_attributes": True}
