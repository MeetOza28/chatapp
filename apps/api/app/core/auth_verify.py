from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.session_token import normalize_session_token
from app.db.queries import find_valid_session_with_user


async def get_current_user_from_session(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Reads the better-auth session token from cookies and verifies
    it against the PostgreSQL session table via SQLAlchemy ORM.
    """
    raw_token = request.cookies.get("chatapp.session_token")
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated — no session cookie",
        )

    row = await find_valid_session_with_user(db, raw_token)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalid or expired — please log in again",
        )

    session, user = row
    return {
        "user_id":  session.user_id,
        "name":     user.name,
        "email":    user.email,
        "username": user.username,
    }
