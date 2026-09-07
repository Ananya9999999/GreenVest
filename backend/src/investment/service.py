"""Investment Cost Calculator + ROI / break-even logic."""

from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Parcel, InvestmentCalculation
from src.api.schemas import (
    InvestmentCostRequest,
    InvestmentCostBreakdown,
    ROIResult,
    InvestmentAnalysisOut,
)

# Base cost assumptions (INR per hectare) — tunable for production
COST_TABLE = {
    "maximum_carbon": {
        "plantation": 8000,
        "saplings": 4500,
        "labour": 6000,
        "irrigation": 3500,
        "maintenance_annual": 2500,
        "roi_percent": 6.0,
    },
    "maximum_roi": {
        "plantation": 12000,
        "saplings": 7000,
        "labour": 9000,
        "irrigation": 8000,
        "maintenance_annual": 4000,
        "roi_percent": 14.0,
    },
    "balanced": {
        "plantation": 10000,
        "saplings": 5500,
        "labour": 7500,
        "irrigation": 5500,
        "maintenance_annual": 3200,
        "roi_percent": 10.0,
    },
}


def _health_cost_factor(health_score: float | None) -> float:
    """Better land health → slightly lower establishment cost."""
    if health_score is None:
        return 1.0
    # health 50 → 1.1, health 90 → 0.9
    return max(0.75, min(1.25, 1.2 - (health_score / 100.0) * 0.4))


def calculate_costs(
    area_ha: float,
    strategy_type: str,
    health_score: float | None = None,
    land_cost: float = 0.0,
    maintenance_years: int = 5,
) -> InvestmentCostBreakdown:
    table = COST_TABLE.get(strategy_type, COST_TABLE["balanced"])
    factor = _health_cost_factor(health_score)

    plantation = round(table["plantation"] * area_ha * factor, 0)
    saplings = round(table["saplings"] * area_ha * factor, 0)
    labour = round(table["labour"] * area_ha * factor, 0)
    irrigation = round(table["irrigation"] * area_ha * factor, 0)
    maintenance = round(table["maintenance_annual"] * area_ha * maintenance_years, 0)

    total = land_cost + plantation + saplings + labour + irrigation + maintenance

    return InvestmentCostBreakdown(
        land_cost=land_cost,
        plantation_cost=plantation,
        saplings_cost=saplings,
        labour_cost=labour,
        irrigation_cost=irrigation,
        maintenance_total=maintenance,
        total_investment=total,
    )


def calculate_roi(
    total_investment: float,
    strategy_type: str,
    horizon_years: int = 15,
    climate_risk: float | None = None,
) -> ROIResult:
    table = COST_TABLE.get(strategy_type, COST_TABLE["balanced"])
    base_roi = table["roi_percent"]

    # Climate risk penalty: each risk point above 5 reduces ROI by ~0.4%
    risk_penalty = 0.0
    if climate_risk is not None and climate_risk > 5:
        risk_penalty = (climate_risk - 5) * 0.4
    effective_roi = max(1.0, base_roi - risk_penalty)

    annual_return = total_investment * (effective_roi / 100.0)
    total_return = annual_return * horizon_years

    # Simple payback: investment / annual return
    break_even = None
    if annual_return > 0:
        break_even = round(total_investment / annual_return, 1)

    notes = []
    if climate_risk is not None and climate_risk >= 7:
        notes.append("Elevated climate risk may delay break-even.")
    if strategy_type == "maximum_carbon":
        notes.append("Returns lean on carbon credit realisation; timing is uncertain.")
    if strategy_type == "maximum_roi":
        notes.append("Commercial yields depend on market prices and offtake.")

    return ROIResult(
        expected_roi_percent=round(effective_roi, 2),
        annual_return_estimate=round(annual_return, 0),
        break_even_years=break_even,
        horizon_years=horizon_years,
        total_return_estimate=round(total_return, 0),
        climate_risk_score=climate_risk,
        notes=notes,
    )


async def run_investment_analysis(
    db: AsyncSession,
    parcel: Parcel,
    request: InvestmentCostRequest,
    user_id: str | None = None,
    horizon_years: int = 15,
) -> InvestmentAnalysisOut:
    health = parcel.scores.health_score if parcel.scores else None
    climate_risk = parcel.scores.climate_risk if parcel.scores else None

    land_cost = 0.0
    if request.land_cost_override is not None:
        land_cost = request.land_cost_override
    elif parcel.listing_price is not None:
        land_cost = parcel.listing_price

    costs = calculate_costs(
        area_ha=parcel.area_hectares,
        strategy_type=request.strategy_type,
        health_score=health,
        land_cost=land_cost,
        maintenance_years=request.include_maintenance_years,
    )

    returns = calculate_roi(
        total_investment=costs.total_investment,
        strategy_type=request.strategy_type,
        horizon_years=horizon_years,
        climate_risk=climate_risk,
    )

    # Persist for history
    record = InvestmentCalculation(
        parcel_id=parcel.id,
        user_id=user_id,
        strategy_type=request.strategy_type,
        land_cost=costs.land_cost,
        plantation_cost=costs.plantation_cost,
        saplings_cost=costs.saplings_cost,
        labour_cost=costs.labour_cost,
        irrigation_cost=costs.irrigation_cost,
        maintenance_annual=costs.maintenance_total / max(1, request.include_maintenance_years),
        total_investment=costs.total_investment,
        expected_roi_percent=returns.expected_roi_percent,
        break_even_years=returns.break_even_years,
    )
    db.add(record)
    await db.flush()

    return InvestmentAnalysisOut(
        land_id=parcel.land_id,
        strategy_type=request.strategy_type,
        costs=costs,
        returns=returns,
        calculation_id=record.id,
    )
