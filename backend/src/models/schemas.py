"""
Shared data models for GreenVest AI and Land Investment Engine.
"""

from enum import Enum
from typing import Optional, List, Dict, Any
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
    """Land data received from user / Geospatial / Marketplace."""
    land_id: str = "GV-2026-001"
    location: str = "Nashik, Maharashtra"
    area_hectares: float = 12.5
    soil_type: Optional[str] = "Black soil"
    water_availability: Optional[str] = "Moderate"
    budget: float = 500000.0
    investment_horizon_years: int = 15
    health_score: float = Field(82.0, ge=0, le=100)
    soil_score: Optional[float] = 78.0
    water_score: Optional[float] = 70.0
    climate_score: Optional[float] = 85.0
    vegetation_score: Optional[float] = 75.0
    terrain_score: Optional[float] = 80.0
    climate_risk: Optional[float] = 4.5  # 0–10


class SmartLandAnalysis(BaseModel):
    """Smart Land Analysis output representing bio-climatic conditions."""
    climate_type: str
    annual_rainfall_mm: float
    rainfall_seasonality: str
    temperature_range_celsius: str
    avg_annual_temp_celsius: float
    soil_suitability: str
    soil_fertility_index: float
    soil_ph: float
    water_availability_level: str
    groundwater_table_depth_m: float
    overview_text: str


class GreenScoreFactor(BaseModel):
    name: str
    score: float
    weight: float
    status: str
    insight: str


class GreenScore(BaseModel):
    """Signature GreenScore (0-100)."""
    overall_score: int
    tier: str
    factors: List[GreenScoreFactor]
    summary: str


class NatureImpactScore(BaseModel):
    """Holistic multi-factor ecological metric (0-100)."""
    overall_score: int
    carbon_score: float
    biodiversity_score: float
    water_impact_score: float
    soil_improvement_score: float
    interpretation: str


class CostBreakdown(BaseModel):
    saplings: float
    land_preparation: float
    irrigation_infrastructure: float
    fencing_and_protection: float
    total_initial_cost: float


class MaintenanceSchedule(BaseModel):
    annual_cost: float
    irrigation_frequency: str
    weeding_and_pruning: str
    soil_enrichment: str


class InvestmentMetrics(BaseModel):
    initial_cost: float
    cumulative_maintenance_20y: float
    carbon_revenue_annual_avg: float
    harvest_revenue_annual_avg: float
    total_projected_returns: float
    roi_percent: float
    breakeven_years: float


class StrategyScores(BaseModel):
    """Per-strategy factor scores (0–10)."""
    carbon: float
    roi: float
    risk: float          # lower is better; inverted during ranking
    biodiversity: float
    water_efficiency: float


class StrategyRecommendation(BaseModel):
    strategy_type: StrategyType
    title: str
    approach: str
    recommended_species: List[str]
    density_trees_per_ha: int
    total_trees: int
    scores: StrategyScores
    carbon_potential_tco2e_per_ha: float
    cost_breakdown: CostBreakdown
    maintenance: MaintenanceSchedule
    investment: InvestmentMetrics
    estimated_investment: float  # For backward-compat
    expected_roi_percent: float  # For backward-compat
    risk_level: str
    rank_score: float = 0.0
    rank: int = 0
    ai_recommendation_reason: str = ""


class CarbonForecast(BaseModel):
    years: int
    sequestered_tco2e: float
    cumulative_tco2e: float
    min_tco2e: float = 0.0
    expected_tco2e: float = 0.0
    max_tco2e: float = 0.0
    cumulative_min: float = 0.0
    cumulative_expected: float = 0.0
    cumulative_max: float = 0.0
    credit_value_usd_range: str = "$0 – $0"


class CarbonCreditEstimate(BaseModel):
    estimated_credits: float
    value_low_usd: float
    value_high_usd: float
    note: str = "Indicative estimate only — not guaranteed financial returns."


class ClimateRiskHazard(BaseModel):
    name: str
    icon: str
    level: str
    score: float
    detail: str


class ClimateRiskAnalysis(BaseModel):
    overall_risk_score: float
    risk_category: str
    hazards: List[ClimateRiskHazard]
    advisory: str


class ComparisonMetricRow(BaseModel):
    metric: str
    native_forest: str
    bamboo: str
    agroforestry: str


class StrategyComparisonEngine(BaseModel):
    matrix: List[ComparisonMetricRow]
    ai_recommended_strategy: str
    recommendation_rationale: str


class AdvisorResult(BaseModel):
    land_id: str
    smart_land: SmartLandAnalysis
    greenscore: GreenScore
    nature_impact: NatureImpactScore
    strategies: List[StrategyRecommendation]
    carbon_forecasts: List[CarbonForecast]
    credit_estimate: CarbonCreditEstimate
    climate_risk: ClimateRiskAnalysis
    comparison: StrategyComparisonEngine
    best_match: StrategyRecommendation


class WhatIfRequest(BaseModel):
    land_input: LandInput
    preference_weights: Optional[PreferenceWeights] = None
    rainfall_change_percent: float = 0.0  # -30% to +30%
    budget_delta_percent: float = 0.0     # -50% to +100%
    investment_horizon_years: int = 15
    carbon_credit_price_usd: float = 18.0
    water_availability_override: Optional[str] = None


class WhatIfResult(BaseModel):
    baseline_strategy: str
    rainfall_change_applied: float
    carbon_20y_range: str
    carbon_delta_percent: float
    projected_roi_percent: float
    roi_delta_percent: float
    climate_risk_score: float
    risk_delta_percent: float
    breakeven_years: float
    resilience_verdict: str
    recommended_adjustment: str


class ChatMessageRequest(BaseModel):
    message: str
    land_id: Optional[str] = "GV-2026-001"
    context: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    reply: str
