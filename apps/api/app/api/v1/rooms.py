import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, func, desc, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_verify import get_current_user_from_session
from app.core.dependencies import get_db
from app.core.rate_limit import limiter
from app.core.sanitize import clean_text
from app.models.room import Room, RoomMember
from app.models.message import Message
from app.schemas.rooms import (
    MessageInRoom,
    MessagesResponse,
    RoomCreate,
    RoomDetail,
    RoomPublic,
    MessagePreview,
)

router = APIRouter(prefix="/rooms", tags=["rooms"])


# ── Helper — verify room exists ───────────────────────────────
async def _get_room_or_404(room_id: str, db: AsyncSession) -> Room:
    result = await db.execute(
        select(Room).where(Room.id == room_id)
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room '{room_id}' not found",
        )
    return room


# ── Helper — get member count ─────────────────────────────────
async def _get_member_count(room_id: str, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).where(RoomMember.room_id == room_id)
    )
    return result.scalar() or 0


# ── Helper — get last message preview ────────────────────────
async def _get_last_message(
    room_id: str, db: AsyncSession
) -> Optional[MessagePreview]:
    result = await db.execute(
        text("""
            SELECT m.content, u.username AS sender_username, m.sent_at
            FROM   message m
            LEFT JOIN "user" u ON u.id = m.sender_id
            WHERE  m.room_id = :room_id
            ORDER  BY m.sent_at DESC
            LIMIT  1
        """),
        {"room_id": room_id},
    )
    row = result.fetchone()
    if not row:
        return None
    return MessagePreview(
        content=row.content,
        sender_username=row.sender_username or "deleted user",
        sent_at=row.sent_at,
    )


# ── GET /rooms ────────────────────────────────────────────────
@router.get(
    "/",
    response_model=list[RoomDetail],
    summary="List all rooms",
)
@limiter.limit("60/minute")
async def list_rooms(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> list[RoomDetail]:
    """
    Returns only rooms the user is a member of.
    """
    # Get rooms where user is a member
    result = await db.execute(
        text("""
            SELECT DISTINCT r.id, r.name, r.owner_id, r.created_at
            FROM   room r
            INNER JOIN room_member rm ON rm.room_id = r.id
            WHERE  rm.user_id = :user_id
            ORDER  BY r.created_at DESC
        """),
        {"user_id": current_user["user_id"]},
    )
    room_rows = result.fetchall()
    rooms = [Room(id=row[0], name=row[1], owner_id=row[2], created_at=row[3]) for row in room_rows]

    room_details = []
    for room in rooms:
        member_count = await _get_member_count(room.id, db)
        last_message = await _get_last_message(room.id, db)

        room_details.append(
            RoomDetail(
                id=room.id,
                name=room.name,
                owner_id=room.owner_id,
                created_at=room.created_at,
                member_count=member_count,
                last_message=last_message,
            )
        )

    return room_details


# ── POST /rooms ───────────────────────────────────────────────
@router.post(
    "/",
    response_model=RoomPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new room",
)
@limiter.limit("20/minute")
async def create_room(
    request: Request,
    body: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> RoomPublic:
    """
    Creates a room and automatically adds the creator as a member.
    Room name is sanitized and checked for uniqueness.
    """
    # Sanitize (Pydantic validator already ran, this is double safety)
    name = clean_text(body.name)

    # Check name uniqueness
    existing = await db.execute(
        select(Room).where(Room.name == name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A room named '{name}' already exists",
        )

    # Create room
    room = Room(
        id=str(uuid.uuid4()),
        name=name,
        owner_id=current_user["user_id"],
    )
    db.add(room)
    await db.flush()  # write to get the id back
    # await db.commit()

    # Add creator as first member
    member = RoomMember(
        room_id=room.id,
        user_id=current_user["user_id"],
    )
    db.add(member)
    await db.flush()
    await db.commit()

    return RoomPublic(
        id=room.id,
        name=room.name,
        owner_id=room.owner_id,
        created_at=room.created_at,
        member_count=1,
    )


# ── GET /rooms/{room_id} ──────────────────────────────────────
@router.get(
    "/{room_id}",
    response_model=RoomDetail,
    summary="Get room detail",
)
@limiter.limit("60/minute")
async def get_room(
    request: Request,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> RoomDetail:
    """Returns full room detail including member count and last message."""
    room = await _get_room_or_404(room_id, db)

    member_count = await _get_member_count(room_id, db)
    last_message = await _get_last_message(room_id, db)

    return RoomDetail(
        id=room.id,
        name=room.name,
        owner_id=room.owner_id,
        created_at=room.created_at,
        member_count=member_count,
        last_message=last_message,
    )


# ── POST /rooms/{room_id}/join ────────────────────────────────
@router.post(
    "/{room_id}/join",
    status_code=status.HTTP_200_OK,
    summary="Join a room",
)
async def join_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> dict:
    """
    Adds the current user to room_member.
    Idempotent — calling this twice does not error.
    """
    room = await _get_room_or_404(room_id, db)

    # Check if already a member
    existing = await db.execute(
        select(RoomMember).where(
            RoomMember.room_id == room_id,
            RoomMember.user_id == current_user["user_id"],
        )
    )
    already_member = existing.scalar_one_or_none()

    if not already_member:
        member = RoomMember(
            room_id=room_id,
            user_id=current_user["user_id"],
        )
        db.add(member)
        await db.flush()
        await db.commit()

    return {
        "message": "Joined successfully",
        "room_id": room_id,
        "user_id": current_user["user_id"],
    }


# ── GET /rooms/{room_id}/messages ─────────────────────────────
@router.get(
    "/{room_id}/messages",
    response_model=MessagesResponse,
    summary="Get message history for a room",
)
@limiter.limit("60/minute")
async def get_messages(
    request: Request,
    room_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> MessagesResponse:
    """
    Returns last N messages ordered by sent_at DESC.
    Includes sender username in each message.
    limit: default 50, max 100.
    """
    await _get_room_or_404(room_id, db)

    # Clamp limit
    limit = min(max(1, limit), 100)

    # Fetch messages with sender username via JOIN
    rows = await db.execute(
        text("""
            SELECT
                m.id,
                m.room_id,
                m.sender_id,
                COALESCE(u.username, 'deleted user') AS sender_username,
                m.content,
                m.message_type,
                m.sent_at
            FROM   message m
            LEFT JOIN "user" u ON u.id = m.sender_id
            WHERE  m.room_id = :room_id
            ORDER  BY m.sent_at DESC
            LIMIT  :limit
        """),
        {"room_id": room_id, "limit": limit},
    )
    message_rows = rows.fetchall()

    # Get total count
    count_result = await db.execute(
        text("SELECT COUNT(*) FROM message WHERE room_id = :room_id"),
        {"room_id": room_id},
    )
    total = count_result.scalar() or 0

    messages = [
        MessageInRoom(
            id=row.id,
            room_id=row.room_id,
            sender_id=row.sender_id,
            sender_username=row.sender_username,
            content=row.content,
            message_type=row.message_type,
            sent_at=row.sent_at,
        )
        for row in message_rows
    ]

    return MessagesResponse(messages=messages, total=total)


# ── GET /rooms/{room_id}/members ──────────────────────────────
@router.get(
    "/{room_id}/members",
    response_model=list[dict],
    summary="Get room members",
)
@limiter.limit("60/minute")
async def get_room_members(
    request: Request,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> list[dict]:
    """
    Returns all members of a room with their usernames and IDs.
    """
    await _get_room_or_404(room_id, db)

    result = await db.execute(
        text("""
            SELECT u.id, u.username, u.name, rm.joined_at
            FROM   room_member rm
            JOIN   "user" u ON u.id = rm.user_id
            WHERE  rm.room_id = :room_id
            ORDER  BY rm.joined_at ASC
        """),
        {"room_id": room_id},
    )
    rows = result.fetchall()

    members = [
        {
            "id": row.id,
            "username": row.username or "anonymous",
            "name": row.name,
            "joined_at": row.joined_at.isoformat() if row.joined_at else None,
        }
        for row in rows
    ]

    return members


# ── POST /rooms/{room_id}/add-member ──────────────────────────
@router.post(
    "/{room_id}/add-member",
    status_code=status.HTTP_200_OK,
    summary="Add a member to a room (owner only)",
)
@limiter.limit("30/minute")
async def add_member_to_room(
    request: Request,
    room_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> dict:
    """
    Adds a user to a room. Only the room owner can add members.
    body: {"user_id": "..."}
    """
    room = await _get_room_or_404(room_id, db)

    # Check if current user is owner
    if room.owner_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room owner can add members",
        )

    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required",
        )

    # Check if user exists
    user_result = await db.execute(
        text("SELECT id FROM \"user\" WHERE id = :user_id"),
        {"user_id": user_id},
    )
    if not user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check if already a member
    existing = await db.execute(
        select(RoomMember).where(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        return {
            "message": "User is already a member",
            "room_id": room_id,
            "user_id": user_id,
        }

    # Add member
    member = RoomMember(
        room_id=room_id,
        user_id=user_id,
    )
    db.add(member)
    await db.flush()
    await db.commit()

    return {
        "message": "Member added successfully",
        "room_id": room_id,
        "user_id": user_id,
    }


# ── GET /rooms/{room_id}/available-users ──────────────────────
@router.get(
    "/{room_id}/available-users",
    response_model=list[dict],
    summary="Get users available to add to this room",
)
@limiter.limit("60/minute")
async def get_available_users_for_room(
    request: Request,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> list[dict]:
    """
    Returns all users NOT in the room (excluding current user).
    Only room owner can call this.
    """
    room = await _get_room_or_404(room_id, db)

    # Check if current user is owner
    if room.owner_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room owner can add members",
        )

    result = await db.execute(
        text("""
            SELECT u.id, u.username, u.name
            FROM   "user" u
            WHERE  u.id NOT IN (
                SELECT user_id FROM room_member WHERE room_id = :room_id
            )
            AND u.id != :current_user_id
            ORDER  BY u.username ASC
        """),
        {"room_id": room_id, "current_user_id": current_user["user_id"]},
    )
    rows = result.fetchall()

    users = [
        {
            "id": row.id,
            "username": row.username or "anonymous",
            "name": row.name,
        }
        for row in rows
    ]

    return users
