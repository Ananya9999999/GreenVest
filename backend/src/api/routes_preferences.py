"""Preference Engine routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.base import get_db
from src.db.models import User
from src.api.schemas import PreferenceWeightsIn, PreferenceWeightsOut
from src.auth.deps import get_current_user
from src.preferences import get_preferences, update_preferences

router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.get("", response_model=PreferenceWeightsOut)
async def read_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_preferences(db, current_user.id)


@router.put("", response_model=PreferenceWeightsOut)
async def set_preferences(
    data: PreferenceWeightsIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_preferences(db, current_user.id, data)
