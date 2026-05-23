from urllib.parse import unquote
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db


async def get_current_user_from_session(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Reads the better-auth session token from cookies and verifies
    it against the PostgreSQL session table directly.

    better-auth sets two cookies:
      chatapp.session_token  — the raw token string (what we use)
      chatapp.session_data   — cached session JSON (we ignore this)

    The token value is URL-encoded in the cookie file so we must
    decode it before the DB lookup.
    """

    # Read the session token cookie
    raw_token = request.cookies.get("chatapp.session_token")

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated — no session cookie",
        )

    # URL-decode the token
    # curl saves cookies with %2B and %3D encoding
    # The DB stores the decoded version
    token = unquote(raw_token)

    # Also strip the signature suffix if present
    # better-auth appends .SIGNATURE to the token in cookies
    # The DB stores only the base token before the dot
    # Token format in cookie:  BASE_TOKEN.SIGNATURE
    # Token format in DB:      BASE_TOKEN
    if "." in token:
        token = token.split(".")[0]

    # Query DB — verify token exists and is not expired
    result = await db.execute(
        text("""
            SELECT
                s.user_id,
                s.expires_at,
                u.id,
                u.name,
                u.email,
                u.username
            FROM   session s
            JOIN   "user" u ON u.id = s.user_id
            WHERE  s.token     = :token
            AND    s.expires_at > NOW()
        """),
        {"token": token},
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalid or expired — please log in again",
        )

    return {
        "user_id":  row.user_id,
        "name":     row.name,
        "email":    row.email,
        "username": row.username,
    }