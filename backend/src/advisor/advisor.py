"""
AI Land Advisor — generates top 3 plantation strategies for a given land parcel.
"""

from src.models.schemas import (
    LandInput,
    PreferenceWeights,
    StrategyType,
    StrategyScores,
    StrategyRecommendation,
    AdvisorResult,
)
from src.ranker.ranker import rank_strategies
from src.carbon.forecaster import forecast_sequestration, estimate_credits


# Base strategy templates (expand with real species databases later)
STRATEGY_TEMPLATES = {
    StrategyType.MAX_CARBON: {
        "title": "Maximum Carbon",
        "approach": "Native mixed forest",
        "species": ["Native hardwoods", "Bamboo (clumping)", "Nitrogen-fixing trees"],
        "scores": StrategyScores(
            carbon=9.5, roi=4.0, risk=3.0, biodiversity=9.0, water_efficiency=7.0
        ),
        "carbon_potential_tco2e_per_ha": 12.0,
        "roi_percent": 6.0,
        "risk_level": "Low",
        "cost_per_ha": 1800.0,
    },
    StrategyType.MAX_ROI: {
        "title": "Maximum ROI",
        "approach": "Commercial agroforestry",
        "species": ["Teak / commercial timber", "Fruit trees", "Intercrops"],
        "scores": StrategyScores(
            carbon=5.5, roi=9.0, risk=5.5, biodiversity=4.0, water_efficiency=5.0
        ),
        "carbon_potential_tco2e_per_ha": 7.0,
        "roi_percent": 14.0,
        "risk_level": "Medium",
        "cost_per_ha": 2500.0,
    },
    StrategyType.BALANCED: {
        "title": "Balanced",
        "approach": "Carbon + ROI + biodiversity",
        "species": ["Mixed native + commercial", "Agroforestry strips", "Understory crops"],
        "scores": StrategyScores(
            carbon=7.5, roi=7.0, risk=3.5, biodiversity=7.5, water_efficiency=6.5
        ),
        "carbon_potential_tco2e_per_ha": 9.5,
        "roi_percent": 10.0,
        "risk_level": "Low",
        "cost_per_ha": 2100.0,
    },
}


def _build_strategy(
    strategy_type: StrategyType,
    land: LandInput,
) -> StrategyRecommendation:
    t = STRATEGY_TEMPLATES[strategy_type]
    # Scale investment by area; lightly adjust by health score
    health_factor = 0.8 + (land.health_score / 100.0) * 0.4
    investment = t["cost_per_ha"] * land.area_hectares * health_factor

    return StrategyRecommendation(
        strategy_type=strategy_type,
        title=t["title"],
        approach=t["approach"],
        recommended_species=t["species"],
        scores=t["scores"],
        carbon_potential_tco2e_per_ha=t["carbon_potential_tco2e_per_ha"],
        estimated_investment=round(investment, 0),
        expected_roi_percent=t["roi_percent"],
        risk_level=t["risk_level"],
    )


def recommend(
    land: LandInput,
    weights: PreferenceWeights,
) -> AdvisorResult:
    """
    Main entry point.
    Returns ranked top-3 strategies + carbon forecasts + credit estimate.
    """
    # Build all three strategies
    strategies = [
        _build_strategy(StrategyType.MAX_CARBON, land),
        _build_strategy(StrategyType.MAX_ROI, land),
        _build_strategy(StrategyType.BALANCED, land),
    ]

    # Rank by user preferences
    ranked = rank_strategies(strategies, weights)
    best = ranked[0]

    # Carbon forecast for the best-match strategy
    forecasts = forecast_sequestration(
        strategy_type=best.strategy_type,
        area_hectares=land.area_hectares,
        years=[5, 10, 20],
        health_score=land.health_score,
    )
    credit = estimate_credits(forecasts[-1].cumulative_tco2e)

    return AdvisorResult(
        land_id=land.land_id,
        strategies=ranked,
        carbon_forecasts=forecasts,
        credit_estimate=credit,
        best_match=best,
    )
