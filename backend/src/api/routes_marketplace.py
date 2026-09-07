"""Marketplace routes — browse, filter, deep-dive."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.base import get_db
from src.api.schemas import MarketplaceFilter, MarketplaceListOut, ParcelOut
from src.marketplace import search_marketplace, get_marketplace_listing

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("", response_model=MarketplaceListOut)
async def browse(
    min_health_score: float | None = Query(None),
    max_health_score: float | None = Query(None),
    min_carbon_potential: float | None = Query(None),
    max_budget: float | None = Query(None),
    min_area: float | None = Query(None),
    max_area: float | None = Query(None),
    state: str | None = Query(None),
    district: str | None = Query(None),
    sort_by: str = Query("health_score"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = MarketplaceFilter(
        min_health_score=min_health_score,
        max_health_score=max_health_score,
        min_carbon_potential=min_carbon_potential,
        max_budget=max_budget,
        min_area=min_area,
        max_area=max_area,
        state=state,
        district=district,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return await search_marketplace(db, filters)


@router.get("/{land_id}", response_model=ParcelOut)
async def listing_detail(land_id: str, db: AsyncSession = Depends(get_db)):
    listing = await get_marketplace_listing(db, land_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing
