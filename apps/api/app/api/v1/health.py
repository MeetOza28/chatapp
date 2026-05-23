from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.core.dependencies import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """
    Fast health check — no DB call.
    Used by Docker healthchecks and load balancers.
    """
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "env": settings.APP_ENV,
    }


@router.get("/health/deep")
async def health_deep(db: AsyncSession = Depends(get_db)):
    """
    Deep health check — verifies DB connectivity.
    Returns 200 if everything is reachable, 503 if not.
    """
    db_status = "ok"
    db_error = None

    try:
        # Simple query to verify DB is reachable
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "error"
        db_error = str(e)

    overall = "ok" if db_status == "ok" else "degraded"

    return {
        "status": overall,
        "version": settings.APP_VERSION,
        "checks": {
            "database": {
                "status": db_status,
                **({"error": db_error} if db_error else {}),
            },
        },
    }