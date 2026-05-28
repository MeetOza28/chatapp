FROM ghcr.io/astral-sh/uv:python3.13-alpine AS builder

WORKDIR /app

# Put the virtual environment outside the source tree so we can copy it cleanly
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

COPY apps/api/pyproject.toml uv.lock ./

# Install locked dependencies first for better layer caching
RUN uv sync --frozen --no-dev --no-install-project

COPY apps/api/ .
RUN uv sync --frozen --no-dev


FROM python:3.13-alpine AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	PATH="/opt/venv/bin:$PATH"

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

RUN addgroup -S app && adduser -S -G app app && chown -R app:app /app
USER app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]