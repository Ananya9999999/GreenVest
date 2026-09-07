"""Land Service routes — CRUD for parcels."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.base import get_db
from src.db.models import User
from src.api.schemas import ParcelCreate, ParcelUpdate, ParcelOut
from src.auth.deps import get_current_user, get_optional_user
from src.land import (
    create_parcel,
    get_parcel_by_land_id,
    list_user_parcels,
    update_parcel,
    delete_parcel,
    parcel_to_out,
)

router = APIRouter(prefix="/land", tags=["Land"])


@router.post("", response_model=ParcelOut, status_code=status.HTTP_201_CREATED)
async def create_own_land(
    data: ParcelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register own land and unlock analysis."""
    return await create_parcel(db, data, owner_id=current_user.id)


@router.get("/mine", response_model=list[ParcelOut])
async def my_parcels(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await list_user_parcels(db, current_user.id)


@router.get("/{land_id}", response_model=ParcelOut)
async def get_land(
    land_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    parcel = await get_parcel_by_land_id(db, land_id)
    if not parcel:
        raise HTTPException(status_code=404, detail="Land not found")
    # Private parcels only visible to owner
    if not parcel.is_marketplace and (
        current_user is None or parcel.owner_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorised to view this parcel")
    return parcel_to_out(parcel)


@router.patch("/{land_id}", response_model=ParcelOut)
async def patch_land(
    land_id: str,
    data: ParcelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parcel = await get_parcel_by_land_id(db, land_id)
    if not parcel:
        raise HTTPException(status_code=404, detail="Land not found")
    if parcel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not the owner")
    return await update_parcel(db, parcel, data)


@router.delete("/{land_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_land(
    land_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parcel = await get_parcel_by_land_id(db, land_id)
    if not parcel:
        raise HTTPException(status_code=404, detail="Land not found")
    if parcel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not the owner")
    await delete_parcel(db, parcel)
