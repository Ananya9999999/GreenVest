"""
Carbon Sequestration Forecaster + Credit Potential estimator.
Calculates multi-year carbon capture with credible confidence intervals (low, expected, high bounds)
to realistically model biological variability instead of artificial precision.
"""

from typing import Optional
from src.models.schemas import (
    StrategyType,
    CarbonForecast,
    CarbonCreditEstimate,
)

# Mean annual sequestration rates (tCO2e / ha / year) at full canopy maturity
BASE_RATES = {
    StrategyType.MAX_CARBON: 12.0,   # Native mixed forest (high biomass density)
    StrategyType.MAX_ROI: 7.5,       # Commercial bamboo / fast-rotation agroforestry
    StrategyType.BALANCED: 9.8,      # Agroforestry multi-tier canopy
}

# Uncertainty bounds (+/- percentage)
UNCERTAINTY_BOUNDS = {
    StrategyType.MAX_CARBON: (0.85, 1.18),  # 85% low, 118% high
    StrategyType.MAX_ROI: (0.82, 1.15),
    StrategyType.BALANCED: (0.86, 1.20),
}


def forecast_sequestration(
    strategy_type: StrategyType,
    area_hectares: float,
    years: list[int] = [5, 10, 20],
    health_score: float = 75.0,
) -> list[CarbonForecast]:
    """
    Simulates cumulative carbon sequestration over specified timeframes.
    Uses non-linear sigmoid biological growth curve:
    - Years 1-3: root establishment & modest canopy (40% max rate)
    - Years 4-10: peak biomass accumulation (100% max rate)
    - Years 11-20: canopy closure & steady root-system saturation (85% max rate)
    """
    base_rate = BASE_RATES.get(strategy_type, 9.0)
    health_factor = 0.6 + (health_score / 100.0) * 0.4
    effective_rate = base_rate * health_factor * area_hectares

    low_mult, high_mult = UNCERTAINTY_BOUNDS.get(strategy_type, (0.85, 1.18))

    forecasts: list[CarbonForecast] = []
    cum_exp = 0.0
    cum_min = 0.0
    cum_max = 0.0
    prev_year = 0

    for y in sorted(years):
        period_years = y - prev_year

        # Age growth factor
        if y <= 5:
            growth_factor = 0.65
        elif y <= 10:
            growth_factor = 1.05
        else:
            growth_factor = 0.90

        period_exp = effective_rate * period_years * growth_factor
        period_min = period_exp * low_mult
        period_max = period_exp * high_mult

        cum_exp += period_exp
        cum_min += period_min
        cum_max += period_max

        # Indicative credit value at $15/tCO2e (with $10 min - $25 max market band)
        val_low = round(cum_min * 10.0, 0)
        val_high = round(cum_max * 25.0, 0)

        forecasts.append(
            CarbonForecast(
                years=y,
                sequestered_tco2e=round(period_exp, 1),
                cumulative_tco2e=round(cum_exp, 1),
                min_tco2e=round(period_min, 1),
                expected_tco2e=round(period_exp, 1),
                max_tco2e=round(period_max, 1),
                cumulative_min=round(cum_min, 1),
                cumulative_expected=round(cum_exp, 1),
                cumulative_max=round(cum_max, 1),
                credit_value_usd_range=f"${val_low:,.0f} – ${val_high:,.0f}",
            )
        )
        prev_year = y

    return forecasts


def estimate_credits(
    cumulative_tco2e: float,
    price_low: float = 10.0,
    price_high: float = 25.0,
) -> CarbonCreditEstimate:
    """
    Computes potential voluntary carbon market (VCM) credit yield and revenue potential.
    1 verified carbon unit (VCU / GS-VER) ≈ 1 tCO2e sequestered.
    """
    credits = round(cumulative_tco2e, 1)
    return CarbonCreditEstimate(
        estimated_credits=credits,
        value_low_usd=round(cumulative_tco2e * price_low, 0),
        value_high_usd=round(cumulative_tco2e * price_high, 0),
        note="Indicative estimate based on Gold Standard & Verra voluntary market benchmarks.",
    )
