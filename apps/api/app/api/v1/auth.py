import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.rate_limit import limiter
from app.core.sanitize import clean_text
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_token_hash,
    hash_password,
    verify_password,
    verify_token,
)
from app.core.config import settings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# ── Cookie settings ───────────────────────────────────────────
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60  # seconds


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Set the httpOnly refresh token cookie on a response."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=REFRESH_COOKIE_MAX_AGE,
        httponly=True,           # JS cannot read this cookie
        secure=False,            # Set True in production (HTTPS only)
        samesite="lax",          # lax works for local dev; use strict in prod
        path="/api/v1/auth",     # Cookie only sent to auth endpoints
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Delete the refresh token cookie."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/v1/auth",
    )


# ── POST /auth/register ───────────────────────────────────────
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserPublic,
    summary="Register a new user",
)
@limiter.limit("5/minute")
async def register(
    request: Request,            # Required by SlowAPI for rate limiting
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserPublic:
    # 1. Sanitize username (Pydantic already validated format)
    username = clean_text(body.username)
    email = body.email.lower().strip()

    # 2. Check username uniqueness
    existing_username = await db.execute(
        select(User).where(User.username == username)
    )
    if existing_username.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken",
        )

    # 3. Check email uniqueness
    existing_email = await db.execute(
        select(User).where(User.email == email)
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    # 4. Hash password (bcrypt cost 12)
    hashed = hash_password(body.password)

    # 5. Insert new user
    new_user = User(
        username=username,
        email=email,
        password_hash=hashed,
    )
    db.add(new_user)
    await db.flush()     # write to DB within transaction, get the id back
    await db.refresh(new_user)

    return UserPublic.model_validate(new_user)


# ── POST /auth/login ──────────────────────────────────────────
@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive tokens",
)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    email = body.email.lower().strip()

    # 1. Look up user by email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # 2. Verify password — same error for missing user or wrong password
    #    This prevents user enumeration attacks
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # 3. Create tokens
    access_token = create_access_token({"sub": str(user.id)})

    family_id = uuid.uuid4()
    refresh_token = create_refresh_token({
        "sub": str(user.id),
        "family_id": str(family_id),
    })

    # 4. Store refresh token hash in DB
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    db_token = RefreshToken(
        user_id=user.id,
        token_hash=get_token_hash(refresh_token),
        family_id=family_id,
        revoked=False,
        expires_at=expires_at,
    )
    db.add(db_token)
    await db.flush()

    # 5. Set httpOnly cookie
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(access_token=access_token, token_type="bearer")


# ── POST /auth/refresh ────────────────────────────────────────
@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and get new access token",
)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    # 1. Read refresh token from cookie
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    # 2. Verify JWT signature and expiry
    payload = verify_token(raw_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id   = payload.get("sub")
    family_id = payload.get("family_id")
    token_hash = get_token_hash(raw_token)

    # 3. Look up this token in DB
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == uuid.UUID(user_id),
        )
    )
    db_token = result.scalar_one_or_none()

    if db_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not recognised",
        )

    # 4. If the token was already revoked — token reuse attack detected
    #    Revoke the ENTIRE family (logs out all devices using this family)
    if db_token.revoked:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == uuid.UUID(family_id))
            .values(revoked=True)
        )
        await db.flush()
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reuse detected. Please log in again.",
        )

    # 5. Revoke the old token
    db_token.revoked = True
    await db.flush()

    # 6. Issue new token pair (same family_id)
    new_access = create_access_token({"sub": user_id})
    new_refresh = create_refresh_token({
        "sub": user_id,
        "family_id": family_id,
    })

    # 7. Store new refresh token in DB
    new_expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    new_db_token = RefreshToken(
        user_id=uuid.UUID(user_id),
        token_hash=get_token_hash(new_refresh),
        family_id=uuid.UUID(family_id),
        revoked=False,
        expires_at=new_expires_at,
    )
    db.add(new_db_token)
    await db.flush()

    # 8. Set new cookie
    _set_refresh_cookie(response, new_refresh)

    return TokenResponse(access_token=new_access, token_type="bearer")


# ── POST /auth/logout ─────────────────────────────────────────
@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout — revoke tokens and clear cookie",
)
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    # Revoke ALL refresh tokens for this user
    # This logs out every device, not just the current one
    await db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked == False,   # noqa: E712
        )
        .values(revoked=True)
    )
    await db.flush()

    # Clear the cookie
    _clear_refresh_cookie(response)


# ── GET /auth/me ──────────────────────────────────────────────
@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get current user profile",
)
async def me(
    current_user: User = Depends(get_current_user),
) -> UserPublic:
    return UserPublic.model_validate(current_user)