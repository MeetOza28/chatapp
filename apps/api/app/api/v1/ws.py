"""
Single WebSocket endpoint — one connection per user.

Client connects once at /ws?token=...
Then sends room control messages to join/leave rooms.
Room ID travels as data inside messages, not in the URL.

Message types client → server:
  { "type": "join_room",  "room_id": "..." }   ← join a room
  { "type": "leave_room", "room_id": "..." }   ← leave a room
  { "type": "message",    "room_id": "...", "content": "..." }
  { "type": "typing",     "room_id": "...", "is_typing": true }
  { "type": "pong" }                           ← heartbeat response

Message types server → client:
  { "type": "connected",   "user_id": "...", "username": "..." }
  { "type": "history",     "room_id": "...", "messages": [...] }
  { "type": "online_users","room_id": "...", "users": [...] }
  { "type": "message",     "room_id": "...", ...message fields... }
  { "type": "typing",      "room_id": "...", "user_id": "...", ... }
  { "type": "presence",    "room_id": "...", "status": "online" }
  { "type": "ping" }                           ← heartbeat
  { "type": "error",       "code": N, "detail": "..." }
"""

import asyncio
import uuid
from datetime import datetime, timezone
from urllib.parse import unquote

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AsyncSessionLocal
from app.core.sanitize import clean_text
from app.models.message import Message
from app.models.room import Room, RoomMember
from app.ws.manager import manager

router = APIRouter(tags=["websocket"])


async def _persist_message(
    message_id:   str,
    room_id:      str,
    sender_id:    str | None,
    content:      str,
    message_type: str,
) -> None:
    from app.core.dependencies import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        try:
            session.add(Message(
                id=message_id, room_id=room_id, sender_id=sender_id,
                content=content, message_type=message_type,
            ))
            await session.commit()
        except Exception as e:
            print(f"[WS] Persist failed {message_id}: {e}")
            await session.rollback()


async def _get_last_messages(room_id: str, db: AsyncSession, limit: int = 10) -> list[dict]:
    result = await db.execute(
        text("""
            SELECT m.id,
                   m.room_id,
                   m.sender_id,
                   COALESCE(u.username, u.name, 'deleted user') AS sender_username,
                   m.content,
                   m.message_type,
                   m.sent_at
            FROM   message m
            LEFT   JOIN "user" u ON u.id = m.sender_id
            WHERE  m.room_id  = :room_id
            ORDER  BY m.sent_at DESC LIMIT :limit
        """),
        {"room_id": room_id, "limit": limit},
    )
    return [
        {
            "id":              str(r.id),
            "room_id":         str(r.room_id),
            "sender_id":       str(r.sender_id) if r.sender_id else None,
            "sender_username": r.sender_username,
            "content":         r.content,
            "message_type":    r.message_type,
            "sent_at":         r.sent_at.isoformat() if r.sent_at else None,
        }
        for r in reversed(result.fetchall())
    ]


async def _find_session_row(token: str, db: AsyncSession):
    decoded = unquote(token)
    if "." in decoded:
        decoded = decoded.split(".")[0]
    
    print(f"[WS] Looking up token (first 20 chars): {decoded[:20]}...")  # ← add this

    result = await db.execute(
        text("""
            SELECT s.user_id, u.username, u.name
            FROM   session s
            JOIN   "user" u ON u.id = s.user_id
            WHERE  s.token = :token AND s.expires_at > NOW()
        """),
        {"token": decoded},
    )
    return result.fetchone()


async def handle_ai_reply(
    raw_content: str, room_id: str, triggering_user_id: str
) -> None:
    from app.agents.chat_agent   import get_ai_reply
    from app.agents.rate_limiter import check_ai_rate_limit

    allowed, _ = check_ai_rate_limit(room_id)
    if not allowed:
        await manager.send_to_user(triggering_user_id, {
            "type": "error", "code": 4029,
            "detail": "AI rate limit reached. Try again in a minute.",
        })
        return

    # Check Groq key (not Google anymore)
    from app.core.config import settings
    if not settings.GROQ_API_KEY:
        await manager.send_to_user(triggering_user_id, {
            "type": "error", "code": 4099,
            "detail": "AI not configured. Add GROQ_API_KEY to .env.",
        })
        return

    stripped = raw_content[4:].strip()  # remove "@ai "
    if not stripped:
        return

    async with AsyncSessionLocal() as db:
        context = await _get_last_messages(room_id, db, limit=10)

    try:
        reply = await asyncio.wait_for(
            get_ai_reply(user_message=stripped, context=context),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        await manager.send_to_user(triggering_user_id, {
            "type": "error", "code": 4098, "detail": "AI timed out.",
        })
        return
    except Exception as e:
        print(f"[AI] Error: {e}")
        return

    if not reply:
        return

    reply      = clean_text(reply)
    message_id = str(uuid.uuid4())
    sent_at    = datetime.now(timezone.utc)

    await manager.broadcast_to_room(room_id, {
        "type":            "message",
        "id":              message_id,
        "room_id":         room_id,
        "sender_id":       None,
        "sender_username": "AI Assistant",
        "content":         reply,
        "message_type":    "ai",
        "sent_at":         sent_at.isoformat(),
    })

    asyncio.create_task(
        _persist_message(message_id, room_id, None, reply, "ai")
    )

# ── Single WebSocket endpoint ─────────────────────────────────
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token:     str | None = Query(default=None),
):
    # ── 1. Validate session token ───────────────────────────
    row = None
    async with AsyncSessionLocal() as db:
        for candidate in (token, websocket.cookies.get("chatapp.session_token")):
            print(f"[WS] Trying token candidate: {candidate}")
            if not candidate:
                continue
            row = await _find_session_row(candidate, db)
            if row:
                break
    if not row:
        await websocket.close(code=4001, reason="Invalid or expired session")
        return

    user_id  = row.user_id
    username = row.username or row.name or "user"

    # ── 2. Connect (one socket per user) ────────────────────
    connected = await manager.connect(
        websocket=websocket,
        user_id=user_id,
        username=username,
    )
    if not connected:
        return

    # Confirm connection to client
    await manager.send_to_user(user_id, {
        "type":     "connected",
        "user_id":  user_id,
        "username": username,
    })

    # ── 3. Message loop ─────────────────────────────────────
    try:
        while True:
            try:
                data = await websocket.receive_json()
            except Exception:
                await manager.send_to_user(user_id, {
                    "type": "error", "code": 4030, "detail": "Invalid JSON",
                })
                continue

            msg_type = data.get("type", "")
            room_id  = data.get("room_id", "")

            # ── Join room ─────────────────────────────────
            if msg_type == "join_room":
                if not room_id:
                    await manager.send_to_user(user_id, {
                        "type": "error", "code": 4040, "detail": "room_id required",
                    })
                    continue

                # Verify room exists
                async with AsyncSessionLocal() as join_db:
                    room_res = await join_db.execute(select(Room).where(Room.id == room_id))
                    if not room_res.scalar_one_or_none():
                        await manager.send_to_user(user_id, {
                            "type": "error", "code": 4003, "detail": "Room not found",
                        })
                        continue

                    # Verify membership
                    mem_res = await join_db.execute(
                        select(RoomMember).where(
                            RoomMember.room_id == room_id,
                            RoomMember.user_id == user_id,
                        )
                    )
                    if not mem_res.scalar_one_or_none():
                        await manager.send_to_user(user_id, {
                            "type": "error", "code": 4004, "detail": "Not a room member",
                        })
                        continue

                    await manager.join_room(user_id, room_id, join_db)

            # ── Leave room ────────────────────────────────
            elif msg_type == "leave_room":
                if room_id:
                    await manager.leave_room(user_id, room_id)

            # ── Send message ──────────────────────────────
            elif msg_type == "message":
                if not room_id:
                    await manager.send_to_user(user_id, {
                        "type": "error", "code": 4040, "detail": "room_id required",
                    })
                    continue

                # Must be in the room to send
                if manager.user_rooms.get(user_id) != room_id:
                    await manager.send_to_user(user_id, {
                        "type": "error", "code": 4041,
                        "detail": "Join the room first before sending messages",
                    })
                    continue

                # Rate limit
                if not await manager.check_rate_limit(user_id, room_id):
                    await manager.send_to_user(user_id, {
                        "type": "error", "code": 4029, "detail": "Too many messages",
                    })
                    continue

                raw = data.get("content", "")
                if not isinstance(raw, str) or not raw.strip():
                    await manager.send_to_user(user_id, {
                        "type": "error", "code": 4010, "detail": "Content cannot be empty",
                    })
                    continue

                if len(raw) > 2000:
                    await manager.send_to_user(user_id, {
                        "type": "error", "code": 4011, "detail": "Message too long",
                    })
                    continue

                content = clean_text(raw)
                if not content:
                    continue

                is_ai = content.strip().lower().startswith("@ai ")

                message_id = str(uuid.uuid4())
                sent_at    = datetime.now(timezone.utc)

                await manager.broadcast_to_room(room_id, {
                    "type":            "message",
                    "id":              message_id,
                    "room_id":         room_id,
                    "sender_id":       user_id,
                    "sender_username": username,
                    "content":         content,
                    "message_type":    "text",
                    "sent_at":         sent_at.isoformat(),
                })

                asyncio.create_task(
                    _persist_message(message_id, room_id, user_id, content, "text")
                )

                if is_ai:
                    asyncio.create_task(
                        handle_ai_reply(content, room_id, user_id)
                    )

            # ── Typing ────────────────────────────────────
            elif msg_type == "typing":
                if room_id and manager.user_rooms.get(user_id) == room_id:
                    await manager.broadcast_to_room(
                        room_id,
                        {
                            "type":      "typing",
                            "room_id":   room_id,
                            "user_id":   user_id,
                            "username":  username,
                            "is_typing": bool(data.get("is_typing", False)),
                        },
                        exclude_user_id=user_id,
                    )

            elif msg_type == "pong":
                pass  # heartbeat response

            else:
                await manager.send_to_user(user_id, {
                    "type": "error", "code": 4020,
                    "detail": f"Unknown type: {msg_type}",
                })

    except WebSocketDisconnect:
        await manager.disconnect(user_id)

    except asyncio.CancelledError:
        await manager.disconnect(user_id)

    except Exception as e:
        print(f"[WS] Error user={user_id}: {type(e).__name__}: {e}")
        try:
            await manager.disconnect(user_id)
        except Exception:
            pass