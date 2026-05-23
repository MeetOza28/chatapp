from slowapi import Limiter
from slowapi.util import get_remote_address

# ── Limiter instance ──────────────────────────────────────────
# key_func=get_remote_address  →  rate limit by client IP
# default_limits               →  fallback limit for any route
#                                 that doesn't have its own @limiter.limit()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],
)

# Import this in routers like:
#   from app.core.rate_limit import limiter
#
# Then decorate endpoints:
#   @router.post("/login")
#   @limiter.limit("10/minute")
#   async def login(request: Request, ...):