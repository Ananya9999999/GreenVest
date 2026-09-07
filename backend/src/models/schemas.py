"""
Shared data models for GreenVest AI module.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class StrategyType(str, Enum):
    MAX_CARBON = "maximum_carbon"
    MAX_ROI = "maximum_roi"
    BALANCED = "balanced"


class PreferenceWeights(BaseModel):
    """User preference weights (0–10 scale)."""
    carbon: float = Field(5.0, ge=0, le=10)
    roi: float = Field(5.0, ge=0, le=10)
    low_risk: float = Field(5.0, ge=0, le=10)
    biodiversity: float = Field(5.0, ge=0, le=10)
    water_efficiency: float = Field(5.0, ge=0, le=10)


class LandInput(BaseModel):
    """Land data received from Geospatial / Backend."""
    land_id: str
    location: str
    area_hectares: float
    budget: float
    investment_horizon_years: int
    health_score: float = Field(..., ge=0, le=100)
    soil_score: Optional[float] = None
    water_score: Optional[float] = None
    climate_score: Optional[float] = None
    vegetation_score: Optional[float] = None
    terrain_score: Optional[float] = None
    climate_risk: Optional[float] = None  # 0–10


class StrategyScores(BaseModel):
    """Per-strategy factor scores (0–10)."""
    carbon: float
    roi: float
    risk: float          # lower is better; we invert when ranking
    biodiversity: float
    water_efficiency: float


class StrategyRecommendation(BaseModel):
    strategy_type: StrategyType
    title: str
    approach: str
    recommended_species: list[str]
    scores: StrategyScores
    carbon_potential_tco2e_per_ha: float
    estimated_investment: float
    expected_roi_percent: float
    risk_level: str
    rank_score: float = 0.0
    rank: int = 0


class CarbonForecast(BaseModel):
    years: int
    sequestered_tco2e: float
    cumulative_tco2e: float


class CarbonCreditEstimate(BaseModel):
    estimated_credits: float
    value_low_usd: float
    value_high_usd: float
    note: str = "Indicative estimate only — not guaranteed financial returns."


class AdvisorResult(BaseModel):
    land_id: str
    strategies: list[StrategyRecommendation]
    carbon_forecasts: list[CarbonForecast]
    credit_estimate: CarbonCreditEstimate
    best_match: StrategyRecommendation
