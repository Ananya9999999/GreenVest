"""Preference Engine — store & apply user weights."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import UserPreference
from src.api.schemas import PreferenceWeightsIn, PreferenceWeightsOut


async def get_preferences(db: AsyncSession, user_pk: str) -> PreferenceWeightsOut:
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == user_pk)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        # Create defaults
        prefs = UserPreference(user_id=user_pk)
        db.add(prefs)
        await db.flush()
    return PreferenceWeightsOut(
        carbon=prefs.carbon,
        roi=prefs.roi,
        low_risk=prefs.low_risk,
        biodiversity=prefs.biodiversity,
        water_efficiency=prefs.water_efficiency,
        budget=prefs.budget,
        investment_horizon_years=prefs.investment_horizon_years,
        updated_at=prefs.updated_at,
    )


async def update_preferences(
    db: AsyncSession,
    user_pk: str,
    data: PreferenceWeightsIn,
) -> PreferenceWeightsOut:
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == user_pk)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = UserPreference(user_id=user_pk)
        db.add(prefs)

    prefs.carbon = data.carbon
    prefs.roi = data.roi
    prefs.low_risk = data.low_risk
    prefs.biodiversity = data.biodiversity
    prefs.water_efficiency = data.water_efficiency
    if data.budget is not None:
        prefs.budget = data.budget
    if data.investment_horizon_years is not None:
        prefs.investment_horizon_years = data.investment_horizon_years

    await db.flush()
    return PreferenceWeightsOut(
        carbon=prefs.carbon,
        roi=prefs.roi,
        low_risk=prefs.low_risk,
        biodiversity=prefs.biodiversity,
        water_efficiency=prefs.water_efficiency,
        budget=prefs.budget,
        investment_horizon_years=prefs.investment_horizon_years,
        updated_at=prefs.updated_at,
    )


def weights_to_dict(prefs: PreferenceWeightsOut | PreferenceWeightsIn) -> dict:
    """Helper for ranking engine integration."""
    return {
        "carbon": prefs.carbon,
        "roi": prefs.roi,
        "low_risk": prefs.low_risk,
        "biodiversity": prefs.biodiversity,
        "water_efficiency": prefs.water_efficiency,
    }
