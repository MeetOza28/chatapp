from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.auth   import router as auth_router
from app.api.v1.rooms  import router as rooms_router
from app.api.v1.ws     import router as ws_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router, prefix="")
api_router.include_router(rooms_router)
api_router.include_router(ws_router)