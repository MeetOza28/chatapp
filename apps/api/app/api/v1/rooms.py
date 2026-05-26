import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_verify import get_current_user_from_session
from app.core.dependencies import get_db
from app.core.rate_limit import limiter
from app.core.sanitize import clean_text
from app.db.queries import (
    count_room_messages,
    fetch_available_users_for_room,
    fetch_last_message_preview,
    fetch_room_members,
    fetch_room_messages,
    fetch_rooms_for_user,
    message_to_dict,
)
from app.models.room import Room, RoomMember
from app.models.user import User
from app.schemas.rooms import (
    MessageInRoom,
    MessagesResponse,
    RoomCreate,
    RoomDetail,
    RoomPublic,
)

router = APIRouter(prefix="/rooms", tags=["rooms"])


async def _get_room_or_404(room_id: str, db: AsyncSession) -> Room:
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room '{room_id}' not found",
        )
    return room


async def _get_member_count(room_id: str, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).select_from(RoomMember).where(RoomMember.room_id == room_id)
    )
    return result.scalar() or 0


@router.get("/", response_model=list[RoomDetail], summary="List all rooms")
@limiter.limit("60/minute")
async def list_rooms(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> list[RoomDetail]:
    """Returns only rooms the user is a member of."""
    rooms = await fetch_rooms_for_user(db, current_user["user_id"])

    room_details = []
    for room in rooms:
        member_count = await _get_member_count(room.id, db)
        last_message = await fetch_last_message_preview(db, room.id)
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


@router.post("/", response_model=RoomPublic, status_code=status.HTTP_201_CREATED, summary="Create a new room")
@limiter.limit("20/minute")
async def create_room(
    request: Request,
    body: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> RoomPublic:
    name = clean_text(body.name)

    existing = await db.execute(select(Room).where(Room.name == name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A room named '{name}' already exists",
        )

    room = Room(
        id=str(uuid.uuid4()),
        name=name,
        owner_id=current_user["user_id"],
    )
    db.add(room)
    await db.flush()

    db.add(RoomMember(room_id=room.id, user_id=current_user["user_id"]))
    await db.flush()
    await db.commit()

    return RoomPublic(
        id=room.id,
        name=room.name,
        owner_id=room.owner_id,
        created_at=room.created_at,
        member_count=1,
    )


@router.get("/{room_id}", response_model=RoomDetail, summary="Get room detail")
@limiter.limit("60/minute")
async def get_room(
    request: Request,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> RoomDetail:
    room = await _get_room_or_404(room_id, db)
    return RoomDetail(
        id=room.id,
        name=room.name,
        owner_id=room.owner_id,
        created_at=room.created_at,
        member_count=await _get_member_count(room_id, db),
        last_message=await fetch_last_message_preview(db, room_id),
    )


@router.post("/{room_id}/join", status_code=status.HTTP_200_OK, summary="Join a room")
async def join_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> dict:
    await _get_room_or_404(room_id, db)

    existing = await db.execute(
        select(RoomMember).where(
            RoomMember.room_id == room_id,
            RoomMember.user_id == current_user["user_id"],
        )
    )
    if not existing.scalar_one_or_none():
        db.add(RoomMember(room_id=room_id, user_id=current_user["user_id"]))
        await db.flush()
        await db.commit()

    return {
        "message": "Joined successfully",
        "room_id": room_id,
        "user_id": current_user["user_id"],
    }


@router.get("/{room_id}/messages", response_model=MessagesResponse, summary="Get message history for a room")
@limiter.limit("60/minute")
async def get_messages(
    request: Request,
    room_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> MessagesResponse:
    await _get_room_or_404(room_id, db)
    limit = min(max(1, limit), 100)

    rows = await fetch_room_messages(db, room_id, limit)
    total = await count_room_messages(db, room_id)

    messages = [
        MessageInRoom(
            id=m.id,
            room_id=m.room_id,
            sender_id=m.sender_id,
            sender_username=message_to_dict(m)["sender_username"],
            content=m.content,
            message_type=m.message_type,
            sent_at=m.sent_at,
        )
        for m in rows
    ]
    return MessagesResponse(messages=messages, total=total)


@router.get("/{room_id}/members", response_model=list[dict], summary="Get room members")
@limiter.limit("60/minute")
async def get_room_members(
    request: Request,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> list[dict]:
    await _get_room_or_404(room_id, db)
    members = await fetch_room_members(db, room_id)
    return [
        {
            "id":        m.user.id,
            "username":  m.user.username or "anonymous",
            "name":      m.user.name,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
        }
        for m in members
    ]


@router.post("/{room_id}/add-member", status_code=status.HTTP_200_OK, summary="Add a member to a room (owner only)")
@limiter.limit("30/minute")
async def add_member_to_room(
    request: Request,
    room_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> dict:
    room = await _get_room_or_404(room_id, db)

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

    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

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

    db.add(RoomMember(room_id=room_id, user_id=user_id))
    await db.flush()
    await db.commit()

    return {
        "message": "Member added successfully",
        "room_id": room_id,
        "user_id": user_id,
    }


@router.get("/{room_id}/available-users", response_model=list[dict], summary="Get users available to add to this room")
@limiter.limit("60/minute")
async def get_available_users_for_room(
    request: Request,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_session),
) -> list[dict]:
    room = await _get_room_or_404(room_id, db)

    if room.owner_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room owner can add members",
        )

    users = await fetch_available_users_for_room(
        db, room_id, current_user["user_id"]
    )
    return [
        {
            "id":       u.id,
            "username": u.username or "anonymous",
            "name":     u.name,
        }
        for u in users
    ]
