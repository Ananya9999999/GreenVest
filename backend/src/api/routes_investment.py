"""Investment Cost Calculator + ROI routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.base import get_db
from src.db.models import User
from src.api.schemas import InvestmentCostRequest, InvestmentAnalysisOut
from src.auth.deps import get_current_user, get_optional_user
from src.land import get_parcel_by_land_id
from src.investment import run_investment_analysis
from src.preferences import get_preferences

router = APIRouter(prefix="/investment", tags=["Investment"])


@router.post("/analyse", response_model=InvestmentAnalysisOut)
async def analyse_investment(
    request: InvestmentCostRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    parcel = await get_parcel_by_land_id(db, request.land_id)
    if not parcel:
        raise HTTPException(status_code=404, detail="Land not found")

    horizon = 15
    if current_user:
        prefs = await get_preferences(db, current_user.id)
        if prefs.investment_horizon_years:
            horizon = prefs.investment_horizon_years

    return await run_investment_analysis(
        db=db,
        parcel=parcel,
        request=request,
        user_id=current_user.id if current_user else None,
        horizon_years=horizon,
    )
