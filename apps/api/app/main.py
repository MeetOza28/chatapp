import uvloop
uvloop.install()

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.rate_limit import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀  {settings.APP_NAME} v{settings.APP_VERSION} starting up...")
    print(f"    Environment  : {settings.APP_ENV}")
    print(f"    Allowed origins: {settings.ALLOWED_ORIGINS}")
    yield
    print(f"🛑  {settings.APP_NAME} shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Real-time chat application API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_cors_origins = list(settings.ALLOWED_ORIGINS)
for _extra in ["http://localhost:3000", "http://localhost:3001"]:
    if _extra not in _cors_origins:
        _cors_origins.append(_extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    detail = str(exc) if settings.APP_ENV == "development" else "An unexpected error occurred."
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type":     "https://chatapp.dev/errors/internal-server-error",
            "title":    "Internal Server Error",
            "status":   500,
            "detail":   detail,
            "instance": str(request.url),
        },
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "type":  "https://chatapp.dev/errors/not-found",
            "title": "Not Found",
            "status": 404,
            "detail": f"The path {request.url.path} does not exist.",
            "instance": str(request.url),
        },
    )


@app.exception_handler(405)
async def method_not_allowed_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        content={
            "type":  "https://chatapp.dev/errors/method-not-allowed",
            "title": "Method Not Allowed",
            "status": 405,
            "detail": f"{request.method} is not allowed on {request.url.path}.",
            "instance": str(request.url),
        },
    )


app.include_router(api_router, prefix="/api/v1")