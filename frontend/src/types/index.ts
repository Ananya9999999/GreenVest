export type PreferenceWeights = {
  carbon: number;
  roi: number;
  low_risk: number;
  biodiversity: number;
  water_efficiency: number;
};

export type LandInput = {
  land_id: string;
  location: string;
  area_hectares: number;
  soil_type?: string;
  water_availability?: string;
  budget: number;
  investment_horizon_years: number;
  health_score?: number;
  soil_score?: number;
  water_score?: number;
  climate_score?: number;
  vegetation_score?: number;
  terrain_score?: number;
  climate_risk?: number;
};

export type SmartLandAnalysis = {
  climate_type: string;
  annual_rainfall_mm: number;
  rainfall_seasonality: string;
  temperature_range_celsius: string;
  avg_annual_temp_celsius: number;
  soil_suitability: string;
  soil_fertility_index: number;
  soil_ph: number;
  water_availability_level: string;
  groundwater_table_depth_m: number;
  overview_text: string;
};

export type GreenScoreFactor = {
  name: string;
  score: number;
  weight: number;
  status: string;
  insight: string;
};

export type GreenScore = {
  overall_score: number;
  tier: string;
  factors: GreenScoreFactor[];
  summary: string;
};

export type NatureImpactScore = {
  overall_score: number;
  carbon_score: number;
  biodiversity_score: number;
  water_impact_score: number;
  soil_improvement_score: number;
  interpretation: string;
};

export type CostBreakdown = {
  saplings: number;
  land_preparation: number;
  irrigation_infrastructure: number;
  fencing_and_protection: number;
  total_initial_cost: number;
};

export type MaintenanceSchedule = {
  annual_cost: number;
  irrigation_frequency: string;
  weeding_and_pruning: string;
  soil_enrichment: string;
};

export type InvestmentMetrics = {
  initial_cost: number;
  cumulative_maintenance_20y: number;
  carbon_revenue_annual_avg: number;
  harvest_revenue_annual_avg: number;
  total_projected_returns: number;
  roi_percent: number;
  breakeven_years: number;
};

export type StrategyScores = {
  carbon: number;
  roi: number;
  risk: number;
  biodiversity: number;
  water_efficiency: number;
};

export type StrategyType = "maximum_carbon" | "maximum_roi" | "balanced";

export type StrategyRecommendation = {
  strategy_type: StrategyType;
  title: string;
  approach: string;
  recommended_species: string[];
  density_trees_per_ha: number;
  total_trees: number;
  scores: StrategyScores;
  carbon_potential_tco2e_per_ha: number;
  cost_breakdown: CostBreakdown;
  maintenance: MaintenanceSchedule;
  investment: InvestmentMetrics;
  estimated_investment: number;
  expected_roi_percent: number;
  risk_level: string;
  rank_score: number;
  rank: number;
  ai_recommendation_reason?: string;
};

export type CarbonForecast = {
  years: number;
  sequestered_tco2e: number;
  cumulative_tco2e: number;
  min_tco2e: number;
  expected_tco2e: number;
  max_tco2e: number;
  cumulative_min: number;
  cumulative_expected: number;
  cumulative_max: number;
  credit_value_usd_range: string;
};

export type CarbonCreditEstimate = {
  estimated_credits: number;
  value_low_usd: number;
  value_high_usd: number;
  note: string;
};

export type ClimateRiskHazard = {
  name: string;
  icon: string;
  level: string;
  score: number;
  detail: string;
};

export type ClimateRiskAnalysis = {
  overall_risk_score: number;
  risk_category: string;
  hazards: ClimateRiskHazard[];
  advisory: string;
};

export type ComparisonMetricRow = {
  metric: string;
  native_forest: string;
  bamboo: string;
  agroforestry: string;
};

export type StrategyComparisonEngine = {
  matrix: ComparisonMetricRow[];
  ai_recommended_strategy: string;
  recommendation_rationale: string;
};

export type AdvisorResult = {
  land_id: string;
  smart_land: SmartLandAnalysis;
  greenscore: GreenScore;
  nature_impact: NatureImpactScore;
  strategies: StrategyRecommendation[];
  carbon_forecasts: CarbonForecast[];
  credit_estimate: CarbonCreditEstimate;
  climate_risk: ClimateRiskAnalysis;
  comparison: StrategyComparisonEngine;
  best_match: StrategyRecommendation;
};

export type WhatIfRequest = {
  land_input: LandInput;
  preference_weights?: PreferenceWeights;
  rainfall_change_percent: number;
  budget_delta_percent: number;
  investment_horizon_years: number;
  carbon_credit_price_usd: number;
  water_availability_override?: string;
};

export type WhatIfResult = {
  baseline_strategy: string;
  rainfall_change_applied: number;
  carbon_20y_range: string;
  carbon_delta_percent: number;
  projected_roi_percent: number;
  roi_delta_percent: number;
  climate_risk_score: number;
  risk_delta_percent: number;
  breakeven_years: number;
  resilience_verdict: string;
  recommended_adjustment: string;
};

export type SatelliteTimeseriesPoint = {
  date: string;
  ndvi: number;
  soil_moisture: number;
  label: string;
};

export type SatelliteAlert = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
};

export type SatelliteMonitoringData = {
  land_id: string;
  ndvi_current: number;
  ndvi_baseline: number;
  ndvi_trend_percent: number;
  vegetation_health_status: string;
  canopy_cover_percent: number;
  biomass_density_index: string;
  timeseries: SatelliteTimeseriesPoint[];
  recent_alerts: SatelliteAlert[];
};

export type MarketplaceListing = {
  id: string;
  userId: string;
  location: string;
  areaHectares: number;
  healthScore: number;
  carbonPotential: number;
  soilType: string;
  priceHint?: string;
};
