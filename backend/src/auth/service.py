"""Auth service: register, login, UserID generation."""

import secrets
import string

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import create_access_token, hash_password, verify_password
from src.db.models import User, UserPreference
from src.api.schemas import UserRegister, TokenResponse, UserOut


def _generate_user_id() -> str:
    """Public UserID e.g. GV-U-A1B2C3."""
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(6))
    return f"GV-U-{suffix}"


async def register_user(db: AsyncSession, data: UserRegister) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise ValueError("Email already registered")

    user = User(
        user_id=_generate_user_id(),
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()

    # Default preference weights
    prefs = UserPreference(user_id=user.id)
    db.add(prefs)
    await db.flush()

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        email=user.email,
        full_name=user.full_name,
    )


async def login_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email or password")
    if not user.is_active:
        raise ValueError("Account is disabled")

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        email=user.email,
        full_name=user.full_name,
    )


async def get_user_by_id(db: AsyncSession, user_pk: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_pk))
    return result.scalar_one_or_none()


async def get_user_by_public_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.user_id == user_id))
    return result.scalar_one_or_none()


def user_to_out(user: User) -> UserOut:
    return UserOut.model_validate(user)
