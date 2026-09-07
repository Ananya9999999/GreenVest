"""Marketplace Service — listings, sorting, filtering."""

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db.models import Parcel, LandScore
from src.api.schemas import MarketplaceFilter, MarketplaceListOut, ParcelOut
from src.land.service import parcel_to_out


async def search_marketplace(
    db: AsyncSession,
    filters: MarketplaceFilter,
) -> MarketplaceListOut:
    """Browse marketplace parcels with optional filters and sorting."""
    query = (
        select(Parcel)
        .where(Parcel.is_marketplace == True, Parcel.status == "active")  # noqa: E712
        .options(selectinload(Parcel.scores))
    )

    # Join scores when filtering / sorting by score fields
    needs_score_join = any(
        [
            filters.min_health_score is not None,
            filters.max_health_score is not None,
            filters.min_carbon_potential is not None,
            filters.sort_by in ("health_score", "carbon_potential"),
        ]
    )
    if needs_score_join:
        query = query.outerjoin(LandScore, LandScore.parcel_id == Parcel.id)

    conditions = []
    if filters.min_health_score is not None:
        conditions.append(LandScore.health_score >= filters.min_health_score)
    if filters.max_health_score is not None:
        conditions.append(LandScore.health_score <= filters.max_health_score)
    if filters.min_carbon_potential is not None:
        conditions.append(LandScore.carbon_potential >= filters.min_carbon_potential)
    if filters.max_budget is not None:
        conditions.append(
            (Parcel.listing_price.is_(None)) | (Parcel.listing_price <= filters.max_budget)
        )
    if filters.min_area is not None:
        conditions.append(Parcel.area_hectares >= filters.min_area)
    if filters.max_area is not None:
        conditions.append(Parcel.area_hectares <= filters.max_area)
    if filters.state:
        conditions.append(Parcel.state.ilike(f"%{filters.state}%"))
    if filters.district:
        conditions.append(Parcel.district.ilike(f"%{filters.district}%"))

    if conditions:
        query = query.where(and_(*conditions))

    # Count total
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Sort
    sort_map = {
        "health_score": LandScore.health_score,
        "carbon_potential": LandScore.carbon_potential,
        "listing_price": Parcel.listing_price,
        "area": Parcel.area_hectares,
        "created_at": Parcel.created_at,
    }
    sort_col = sort_map.get(filters.sort_by, LandScore.health_score)
    if filters.sort_order.lower() == "asc":
        query = query.order_by(sort_col.asc().nullslast())
    else:
        query = query.order_by(sort_col.desc().nullslast())

    # Paginate
    offset = (filters.page - 1) * filters.page_size
    query = query.offset(offset).limit(filters.page_size)

    result = await db.execute(query)
    parcels = result.scalars().unique().all()
    items = [parcel_to_out(p) for p in parcels]

    return MarketplaceListOut(
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        items=items,
    )


async def get_marketplace_listing(db: AsyncSession, land_id: str) -> ParcelOut | None:
    result = await db.execute(
        select(Parcel)
        .where(
            Parcel.land_id == land_id,
            Parcel.is_marketplace == True,  # noqa: E712
            Parcel.status == "active",
        )
        .options(selectinload(Parcel.scores))
    )
    parcel = result.scalar_one_or_none()
    return parcel_to_out(parcel) if parcel else None
