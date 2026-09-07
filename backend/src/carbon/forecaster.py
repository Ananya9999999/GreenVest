"""
Carbon Sequestration Forecaster + Credit Potential estimator.
"""

from src.models.schemas import (
    StrategyType,
    CarbonForecast,
    CarbonCreditEstimate,
)


# Rough annual sequestration rates (tCO2e / ha / year) by strategy type.
# These are placeholders — replace with real models / lookup tables later.
BASE_RATES = {
    StrategyType.MAX_CARBON: 12.0,   # native mixed forest
    StrategyType.MAX_ROI: 7.0,       # commercial agroforestry
    StrategyType.BALANCED: 9.5,      # mixed approach
}


def forecast_sequestration(
    strategy_type: StrategyType,
    area_hectares: float,
    years: list[int] = [5, 10, 20],
    health_score: float = 70.0,
) -> list[CarbonForecast]:
    """
    Simple cumulative forecast.
    Health score modulates the rate (higher health → better growth).
    """
    base = BASE_RATES.get(strategy_type, 8.0)
    # Scale rate by health (50–100% of base)
    factor = 0.5 + (health_score / 100.0) * 0.5
    annual_rate = base * factor * area_hectares

    forecasts = []
    cumulative = 0.0
    prev_year = 0
    for y in sorted(years):
        period = y - prev_year
        period_seq = annual_rate * period
        cumulative += period_seq
        forecasts.append(
            CarbonForecast(
                years=y,
                sequestered_tco2e=round(period_seq, 2),
                cumulative_tco2e=round(cumulative, 2),
            )
        )
        prev_year = y
    return forecasts


def estimate_credits(
    cumulative_tco2e: float,
    price_low: float = 5.0,
    price_high: float = 25.0,
) -> CarbonCreditEstimate:
    """
    Indicative carbon credit potential.
    1 credit ≈ 1 tCO2e (simplified).
    """
    return CarbonCreditEstimate(
        estimated_credits=round(cumulative_tco2e, 1),
        value_low_usd=round(cumulative_tco2e * price_low, 0),
        value_high_usd=round(cumulative_tco2e * price_high, 0),
        note="Indicative estimate only — not guaranteed financial returns.",
    )
