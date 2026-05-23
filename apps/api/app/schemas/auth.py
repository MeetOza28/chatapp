from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator, Field


class RegisterRequest(BaseModel):
    username: str = Field(
        min_length=2,
        max_length=50,
        description="2-50 chars, letters/numbers/underscores only",
    )
    email: EmailStr
    password: str = Field(
        min_length=8,
        description="Minimum 8 characters",
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError(
                "Username can only contain letters, numbers, and underscores"
            )
        return v.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v.strip()) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: UUID
    username: str
    email: str
    created_at: datetime

    # Allow SQLAlchemy model instances to be passed directly
    model_config = {"from_attributes": True}