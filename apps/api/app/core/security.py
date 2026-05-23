from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import hashlib
import uuid

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

BCRYPT_ROUNDS = 12


# ── Password helpers ──────────────────────────────────────────
def hash_password(plain_password: str) -> str:
    """Hash a plain-text password with bcrypt (cost 12)."""
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if plain_password matches hashed_password."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# ── Token helpers ─────────────────────────────────────────────
def _build_token(data: Dict[str, Any], expires_delta: timedelta) -> str:
    """Internal helper — builds a signed JWT with exp + jti claims."""
    payload = data.copy()
    now = datetime.now(timezone.utc)
    payload.update({
        "iat": now,
        "exp": now + expires_delta,
        # jti (JWT ID) uniquely identifies this token
        # Used to blacklist individual tokens on logout
        "jti": str(uuid.uuid4()),
    })
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(data: Dict[str, Any]) -> str:
    """
    Create a short-lived access token (15 min by default).
    data must include: { "sub": str(user_id) }
    """
    expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _build_token({**data, "type": "access"}, expires)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a long-lived refresh token (7 days by default).
    data must include: { "sub": str(user_id), "family_id": str(uuid) }
    family_id tracks rotation chains — entire family is revoked on reuse.
    """
    expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _build_token({**data, "type": "refresh"}, expires)


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT.
    Returns the payload dict on success, None on any failure.
    Never raises — callers check for None.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def get_token_hash(token: str) -> str:
    """
    SHA-256 hash of a raw JWT string.
    Used to store refresh tokens in the DB — we never store the raw token.
    """
    return hashlib.sha256(token.encode()).hexdigest()
