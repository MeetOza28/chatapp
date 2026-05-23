from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.core.sanitize import clean_text


# ── Request schemas ───────────────────────────────────────────

class RoomCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=50,
        description="2-50 chars, letters/numbers/spaces/hyphens/underscores",
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        import re
        v = clean_text(v)
        if not re.match(r"^[a-zA-Z0-9_\- ]+$", v):
            raise ValueError(
                "Room name can only contain letters, numbers, "
                "spaces, hyphens and underscores"
            )
        return v


# ── Nested schemas ────────────────────────────────────────────

class MessagePreview(BaseModel):
    """Last message preview shown in room list."""
    content: str
    sender_username: str
    sent_at: datetime

    model_config = {"from_attributes": True}


# ── Response schemas ──────────────────────────────────────────

class RoomPublic(BaseModel):
    """Returned from POST /rooms and in room lists."""
    id: str
    name: str
    owner_id: Optional[str]
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class RoomDetail(RoomPublic):
    """Returned from GET /rooms/{id} — includes last message."""
    last_message: Optional[MessagePreview] = None

    model_config = {"from_attributes": True}


class MessageInRoom(BaseModel):
    """Single message returned in GET /rooms/{id}/messages."""
    id: str
    room_id: str
    sender_id: Optional[str]
    sender_username: str       # joined from user table
    content: str
    message_type: str
    sent_at: datetime

    model_config = {"from_attributes": True}


class MessagesResponse(BaseModel):
    """Response shape for GET /rooms/{id}/messages."""
    messages: list[MessageInRoom]
    total: int