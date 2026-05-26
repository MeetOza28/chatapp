"""Reusable SQLAlchemy ORM queries — no raw SQL."""

from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.session_token import normalize_session_token
from app.models.message import Message
from app.models.room import Room, RoomMember
from app.models.session import Session
from app.models.user import User
from app.schemas.rooms import MessagePreview


def _sender_display_name(user: User | None) -> str:
    if user is None:
        return "deleted user"
    return user.username or user.name or "deleted user"


def message_to_dict(msg: Message) -> dict[str, Any]:
    return {
        "id":              msg.id,
        "room_id":         msg.room_id,
        "sender_id":       msg.sender_id,
        "sender_username": _sender_display_name(msg.sender),
        "content":         msg.content,
        "message_type":    msg.message_type,
        "sent_at":         msg.sent_at.isoformat() if msg.sent_at else None,
    }


async def fetch_room_messages(
    db: AsyncSession,
    room_id: str,
    limit: int = 50,
) -> list[Message]:
    result = await db.execute(
        select(Message)
        .options(selectinload(Message.sender))
        .where(Message.room_id == room_id)
        .order_by(desc(Message.sent_at))
        .limit(limit)
    )
    return list(result.scalars().all())


async def fetch_room_messages_as_dicts(
    db: AsyncSession,
    room_id: str,
    limit: int = 50,
    *,
    chronological: bool = True,
) -> list[dict[str, Any]]:
    rows = await fetch_room_messages(db, room_id, limit)
    if chronological:
        rows = list(reversed(rows))
    return [message_to_dict(m) for m in rows]


async def count_room_messages(db: AsyncSession, room_id: str) -> int:
    result = await db.execute(
        select(func.count()).select_from(Message).where(Message.room_id == room_id)
    )
    return result.scalar() or 0


async def fetch_last_message_preview(
    db: AsyncSession,
    room_id: str,
) -> Optional[MessagePreview]:
    result = await db.execute(
        select(Message)
        .options(selectinload(Message.sender))
        .where(Message.room_id == room_id)
        .order_by(desc(Message.sent_at))
        .limit(1)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        return None
    return MessagePreview(
        content=msg.content,
        sender_username=_sender_display_name(msg.sender),
        sent_at=msg.sent_at,
    )


async def fetch_rooms_for_user(db: AsyncSession, user_id: str) -> list[Room]:
    result = await db.execute(
        select(Room)
        .join(RoomMember, RoomMember.room_id == Room.id)
        .where(RoomMember.user_id == user_id)
        .order_by(desc(Room.created_at))
        .distinct()
    )
    return list(result.scalars().all())


async def fetch_room_members(
    db: AsyncSession,
    room_id: str,
) -> list[RoomMember]:
    result = await db.execute(
        select(RoomMember)
        .options(selectinload(RoomMember.user))
        .where(RoomMember.room_id == room_id)
        .order_by(RoomMember.joined_at.asc())
    )
    return list(result.scalars().all())


async def fetch_available_users_for_room(
    db: AsyncSession,
    room_id: str,
    exclude_user_id: str,
) -> list[User]:
    member_ids = (
        select(RoomMember.user_id).where(RoomMember.room_id == room_id).scalar_subquery()
    )
    result = await db.execute(
        select(User)
        .where(User.id.not_in(member_ids), User.id != exclude_user_id)
        .order_by(User.username.asc())
    )
    return list(result.scalars().all())


async def find_valid_session_with_user(
    db: AsyncSession,
    raw_token: str | None,
) -> tuple[Session, User] | None:
    token = normalize_session_token(raw_token)
    if not token:
        return None

    result = await db.execute(
        select(Session, User)
        .join(User, Session.user_id == User.id)
        .where(
            Session.token == token,
            Session.expires_at > func.now(),
        )
    )
    row = result.first()
    if row is None:
        return None
    return row[0], row[1]


async def find_session_user_for_ws(
    db: AsyncSession,
    raw_token: str | None,
) -> tuple[str, str, str] | None:
    """Return (user_id, username, display_name) for WebSocket auth."""
    row = await find_valid_session_with_user(db, raw_token)
    if not row:
        return None
    session, user = row
    username = user.username or user.name or "user"
    return session.user_id, username, user.name or username
