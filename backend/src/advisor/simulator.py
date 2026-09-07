"""
What-If Scenario Simulator for GreenVest.
Enables real-time dynamic stress-testing of environmental and financial shocks:
- Rainfall fluctuations (-30% to +30%)
- Budget adjustments (-50% to +100%)
- Investment duration shifts
- Carbon credit price volatility ($5 to $50/tonne)
- Water constraint shocks
"""

from src.models.schemas import (
    WhatIfRequest,
    WhatIfResult,
    StrategyType,
    PreferenceWeights,
)
from src.advisor.advisor import recommend


def simulate_scenario(req: WhatIfRequest) -> WhatIfResult:
    """
    Executes a dynamic sensitivity simulation on the land investment parameters.
    """
    weights = req.preference_weights or PreferenceWeights(
        carbon=7.0, roi=7.0, low_risk=6.0, biodiversity=7.0, water_efficiency=6.0
    )

    # 1. Base run
    base_res = recommend(req.land_input, weights)
    base_best = base_res.best_match
    base_forecast_20y = base_res.carbon_forecasts[-1].cumulative_expected
    base_roi = base_best.investment.roi_percent
    base_risk = base_res.climate_risk.overall_risk_score

    # 2. Apply deltas
    rain_pct = req.rainfall_change_percent  # e.g. -20%
    budget_pct = req.budget_delta_percent   # e.g. +10%
    credit_price = req.carbon_credit_price_usd

    # Rainfall impact on biomass/carbon:
    # Native forest has high drought buffering, Bamboo has higher moisture sensitivity
    if base_best.strategy_type == StrategyType.MAX_CARBON:
        carbon_factor = 1.0 + (rain_pct / 100.0) * 0.45
        risk_shift = (-rain_pct / 100.0) * 1.5
    elif base_best.strategy_type == StrategyType.MAX_ROI:
        carbon_factor = 1.0 + (rain_pct / 100.0) * 0.85
        risk_shift = (-rain_pct / 100.0) * 2.5
    else:  # BALANCED
        carbon_factor = 1.0 + (rain_pct / 100.0) * 0.55
        risk_shift = (-rain_pct / 100.0) * 1.8

    # Carbon credit price impact on ROI
    # baseline assumes $15/tCO2e
    credit_price_ratio = credit_price / 15.0
    roi_carbon_boost = (credit_price_ratio - 1.0) * 1.8

    # Budget impact on scale & quality
    budget_factor = 1.0 + (budget_pct / 100.0) * 0.3

    mod_carbon = round(base_forecast_20y * carbon_factor * (1.0 + (budget_pct / 100.0) * 0.15), 1)
    carbon_delta = round(((mod_carbon - base_forecast_20y) / max(1.0, base_forecast_20y)) * 100.0, 1)

    # Carbon range string
    mod_min = round(mod_carbon * 0.86, 0)
    mod_max = round(mod_carbon * 1.18, 0)
    carbon_range_str = f"{mod_min:,.0f} – {mod_max:,.0f} tCO₂e"

    # ROI shift
    rain_roi_drag = (rain_pct / 100.0) * 1.8
    mod_roi = round(max(3.0, base_roi + rain_roi_drag + roi_carbon_boost), 1)
    roi_delta = round(mod_roi - base_roi, 1)

    # Risk shift
    mod_risk = round(min(9.8, max(1.5, base_risk + risk_shift)), 1)
    risk_delta = round(((mod_risk - base_risk) / max(1.0, base_risk)) * 100.0, 1)

    # Break-even shift
    mod_breakeven = round(max(2.5, base_best.investment.breakeven_years - (roi_delta * 0.25)), 1)

    # Resilience verdict & strategy recommendation
    if rain_pct <= -15.0:
        verdict = (
            f"Under a {abs(rain_pct):.0f}% rainfall deficit, soil moisture deficit increases. "
            "Native mixed species and balanced agroforestry sustain root hydraulic redistribution, "
            f"whereas monoculture bamboo faces a {abs(carbon_delta):.1f}% yield contraction."
        )
        best_resilient = "Balanced Agroforestry"
        adj = "Deploy contour swales and drought-hardy leguminous shelterbelts."
    elif rain_pct >= 15.0:
        verdict = (
            f"A {rain_pct:.0f}% rainfall surge boosts annual canopy biomass capture by {carbon_delta:+.1f}%. "
            "Fast-growing species thrive with minimal irrigation requirement."
        )
        best_resilient = base_best.title
        adj = "Ensure proper drainage bunding to prevent temporary root waterlogging."
    else:
        verdict = (
            f"Parameters remain within stable bio-climatic thresholds. Projected 20-year carbon capture "
            f"ranges between {carbon_range_str} with resilient ~{mod_roi}% annualized ROI."
        )
        best_resilient = base_best.title
        adj = "Proceed with scheduled seedling planting and organic soil amendment."

    return WhatIfResult(
        baseline_strategy=base_best.title,
        rainfall_change_applied=rain_pct,
        carbon_20y_range=carbon_range_str,
        carbon_delta_percent=carbon_delta,
        projected_roi_percent=mod_roi,
        roi_delta_percent=roi_delta,
        climate_risk_score=mod_risk,
        risk_delta_percent=risk_delta,
        breakeven_years=mod_breakeven,
        resilience_verdict=verdict,
        recommended_adjustment=adj,
    )
