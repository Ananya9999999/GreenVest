"""Land Service — CRUD for parcels + LandID generation."""

import secrets
import string
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db.models import Parcel, LandScore
from src.api.schemas import ParcelCreate, ParcelUpdate, ParcelOut, LandScoreOut


def _generate_land_id() -> str:
    """Public LandID e.g. GV-L-X9Y8Z7."""
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(6))
    return f"GV-L-{suffix}"


def _score_to_out(score: LandScore | None) -> LandScoreOut | None:
    if score is None:
        return None
    return LandScoreOut.model_validate(score)


def parcel_to_out(parcel: Parcel) -> ParcelOut:
    data = ParcelOut.model_validate(parcel)
    data.scores = _score_to_out(parcel.scores)
    return data


async def create_parcel(
    db: AsyncSession,
    data: ParcelCreate,
    owner_id: Optional[str] = None,
) -> ParcelOut:
    parcel = Parcel(
        land_id=_generate_land_id(),
        owner_id=owner_id,
        location=data.location,
        state=data.state,
        district=data.district,
        area_hectares=data.area_hectares,
        latitude=data.latitude,
        longitude=data.longitude,
        description=data.description,
        is_marketplace=data.is_marketplace,
        listing_price=data.listing_price,
    )
    db.add(parcel)
    await db.flush()

    if data.scores:
        score = LandScore(
            parcel_id=parcel.id,
            health_score=data.scores.health_score,
            soil_score=data.scores.soil_score,
            water_score=data.scores.water_score,
            climate_score=data.scores.climate_score,
            vegetation_score=data.scores.vegetation_score,
            terrain_score=data.scores.terrain_score,
            climate_risk=data.scores.climate_risk,
            carbon_potential=data.scores.carbon_potential,
            soil_type=data.scores.soil_type,
        )
        db.add(score)
        await db.flush()

    # Reload with relationship
    result = await db.execute(
        select(Parcel)
        .where(Parcel.id == parcel.id)
        .options(selectinload(Parcel.scores))
    )
    parcel = result.scalar_one()
    return parcel_to_out(parcel)


async def get_parcel_by_id(db: AsyncSession, parcel_pk: str) -> Parcel | None:
    result = await db.execute(
        select(Parcel)
        .where(Parcel.id == parcel_pk)
        .options(selectinload(Parcel.scores))
    )
    return result.scalar_one_or_none()


async def get_parcel_by_land_id(db: AsyncSession, land_id: str) -> Parcel | None:
    result = await db.execute(
        select(Parcel)
        .where(Parcel.land_id == land_id)
        .options(selectinload(Parcel.scores))
    )
    return result.scalar_one_or_none()


async def list_user_parcels(db: AsyncSession, owner_id: str) -> list[ParcelOut]:
    result = await db.execute(
        select(Parcel)
        .where(Parcel.owner_id == owner_id)
        .options(selectinload(Parcel.scores))
        .order_by(Parcel.created_at.desc())
    )
    parcels = result.scalars().all()
    return [parcel_to_out(p) for p in parcels]


async def update_parcel(
    db: AsyncSession,
    parcel: Parcel,
    data: ParcelUpdate,
) -> ParcelOut:
    for field in (
        "location",
        "state",
        "district",
        "area_hectares",
        "latitude",
        "longitude",
        "description",
        "is_marketplace",
        "listing_price",
        "status",
    ):
        value = getattr(data, field)
        if value is not None:
            setattr(parcel, field, value)

    if data.scores is not None:
        if parcel.scores is None:
            score = LandScore(parcel_id=parcel.id)
            db.add(score)
            await db.flush()
            # refresh relationship
            result = await db.execute(
                select(Parcel)
                .where(Parcel.id == parcel.id)
                .options(selectinload(Parcel.scores))
            )
            parcel = result.scalar_one()

        s = data.scores
        parcel.scores.health_score = s.health_score
        parcel.scores.soil_score = s.soil_score
        parcel.scores.water_score = s.water_score
        parcel.scores.climate_score = s.climate_score
        parcel.scores.vegetation_score = s.vegetation_score
        parcel.scores.terrain_score = s.terrain_score
        parcel.scores.climate_risk = s.climate_risk
        parcel.scores.carbon_potential = s.carbon_potential
        parcel.scores.soil_type = s.soil_type

    await db.flush()
    result = await db.execute(
        select(Parcel)
        .where(Parcel.id == parcel.id)
        .options(selectinload(Parcel.scores))
    )
    parcel = result.scalar_one()
    return parcel_to_out(parcel)


async def delete_parcel(db: AsyncSession, parcel: Parcel) -> None:
    await db.delete(parcel)
    await db.flush()
