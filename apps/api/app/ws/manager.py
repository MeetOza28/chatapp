"""
WebSocket manager — one active connection per user, in-memory only.
"""

import asyncio
import json
from typing import Optional

from fastapi import WebSocket
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AsyncSessionLocal

MAX_CONNECTIONS = 10000


class ConnectionManager:

    def __init__(self):
        self.connections: dict[str, WebSocket] = {}
        self.user_names: dict[str, str] = {}
        self.user_rooms: dict[str, Optional[str]] = {}
        self.room_members: dict[str, set[str]] = {}
        self._user_locks: dict[str, asyncio.Lock] = {}

    def _lock_for(self, user_id: str) -> asyncio.Lock:
        if user_id not in self._user_locks:
            self._user_locks[user_id] = asyncio.Lock()
        return self._user_locks[user_id]

    def is_active_socket(self, user_id: str, websocket: WebSocket) -> bool:
        return self.connections.get(user_id) is websocket

    @staticmethod
    def _schedule_close(websocket: WebSocket) -> None:
        """Close in the background — never await close() from connect/disconnect."""

        async def _close() -> None:
            try:
                await websocket.close(code=1000)
            except Exception:
                pass

        asyncio.create_task(_close())

    async def connect(self, websocket: WebSocket, user_id: str, username: str) -> bool:
        if len(self.connections) >= MAX_CONNECTIONS:
            await websocket.close(code=4029)
            return False

        old_ws: WebSocket | None = None
        async with self._lock_for(user_id):
            old_ws = self.connections.pop(user_id, None)
            old_room = self.user_rooms.pop(user_id, None)
            if old_room:
                self._remove_from_room(user_id, old_room)

        if old_ws is not None and old_ws is not websocket:
            self._schedule_close(old_ws)

        async with self._lock_for(user_id):
            await websocket.accept()
            self.connections[user_id] = websocket
            self.user_names[user_id] = username
            self.user_rooms[user_id] = None

        print(f"[WS] Connected: {user_id}")
        return True

    async def disconnect(self, user_id: str, websocket: Optional[WebSocket] = None) -> None:
        removed_ws: WebSocket | None = None
        async with self._lock_for(user_id):
            active_ws = self.connections.get(user_id)
            if active_ws and websocket and active_ws is not websocket:
                return

            current_room = self.user_rooms.get(user_id)
            if current_room:
                self._remove_from_room(user_id, current_room)

            removed_ws = self.connections.pop(user_id, None)
            self.user_names.pop(user_id, None)
            self.user_rooms.pop(user_id, None)

        if removed_ws and websocket and removed_ws is websocket:
            self._schedule_close(websocket)
            print(f"[WS] Disconnected: {user_id}")

    async def _drop_failed_socket(self, user_id: str, websocket: WebSocket) -> None:
        """Remove a dead socket without calling full disconnect (avoids lock chains)."""
        async with self._lock_for(user_id):
            if self.connections.get(user_id) is not websocket:
                return
            current_room = self.user_rooms.get(user_id)
            if current_room:
                self._remove_from_room(user_id, current_room)
            self.connections.pop(user_id, None)
            self.user_names.pop(user_id, None)
            self.user_rooms.pop(user_id, None)
        self._schedule_close(websocket)

    async def join_room(self, user_id: str, room_id: str) -> None:
        username = self.user_names.get(user_id, "unknown")
        prev_room = self.user_rooms.get(user_id)

        if prev_room and prev_room != room_id:
            self._remove_from_room(user_id, prev_room)
            asyncio.create_task(self.broadcast_to_room(prev_room, {
                "type": "presence", "user_id": user_id,
                "username": username, "status": "offline",
            }))

        if room_id not in self.room_members:
            self.room_members[room_id] = set()
        self.room_members[room_id].add(user_id)
        self.user_rooms[user_id] = room_id

        ws = self.connections.get(user_id)
        if not ws:
            return

        async with AsyncSessionLocal() as db:
            history = await self._fetch_history(room_id, db)

        if self.connections.get(user_id) != ws or self.user_rooms.get(user_id) != room_id:
            return

        await self._send(ws, {
            "type": "history", "room_id": room_id, "messages": history,
        })
        online = self._get_online_users(room_id)
        await self._send(ws, {
            "type": "online_users", "room_id": room_id, "users": online,
        })

        if self.connections.get(user_id) == ws and self.user_rooms.get(user_id) == room_id:
            asyncio.create_task(self.broadcast_to_room(room_id, {
                "type": "presence", "user_id": user_id,
                "username": username, "status": "online",
            }))

    async def leave_room(self, user_id: str, room_id: str) -> None:
        username = self.user_names.get(user_id, "unknown")
        self._remove_from_room(user_id, room_id)
        if self.user_rooms.get(user_id) == room_id:
            self.user_rooms[user_id] = None
        asyncio.create_task(self.broadcast_to_room(room_id, {
            "type": "presence", "user_id": user_id,
            "username": username, "status": "offline",
        }))

    async def broadcast_to_room(
        self, room_id: str, message: dict, exclude_user_id: Optional[str] = None
    ) -> None:
        members = self.room_members.get(room_id, set()).copy()
        dead_sockets: list[tuple[str, WebSocket]] = []
        orphaned: list[str] = []

        for uid in members:
            if uid == exclude_user_id:
                continue
            ws = self.connections.get(uid)
            if ws:
                ok = await self._send(ws, message)
                if not ok:
                    dead_sockets.append((uid, ws))
            else:
                orphaned.append(uid)

        for uid in orphaned:
            self._remove_from_room(uid, room_id)

        for uid, ws in dead_sockets:
            if self.connections.get(uid) is ws:
                await self._drop_failed_socket(uid, ws)

    async def send_to_user(self, user_id: str, message: dict) -> bool:
        ws = self.connections.get(user_id)
        if ws:
            return await self._send(ws, message)
        return False

    async def check_rate_limit(self, user_id: str, room_id: str) -> bool:
        return True

    def _remove_from_room(self, user_id: str, room_id: str) -> None:
        if room_id in self.room_members:
            self.room_members[room_id].discard(user_id)
            if not self.room_members[room_id]:
                del self.room_members[room_id]

    def _get_online_users(self, room_id: str) -> list[dict]:
        members = self.room_members.get(room_id, set())
        return [
            {"user_id": uid, "username": self.user_names.get(uid, "unknown")}
            for uid in members
        ]

    async def _send(self, websocket: WebSocket, message: dict) -> bool:
        try:
            await websocket.send_text(json.dumps(message, default=str))
            return True
        except Exception:
            return False

    async def _fetch_history(self, room_id: str, db: AsyncSession, limit: int = 50) -> list[dict]:
        try:
            result = await db.execute(
                text("""
                    SELECT m.id, m.room_id, m.sender_id,
                           COALESCE(u.username, u.name, 'deleted user') AS sender_username,
                           m.content, m.message_type, m.sent_at
                    FROM   message m
                    LEFT   JOIN "user" u ON u.id = m.sender_id
                    WHERE  m.room_id = :room_id
                    ORDER  BY m.sent_at DESC
                    LIMIT  :limit
                """),
                {"room_id": room_id, "limit": limit},
            )
            rows = result.fetchall()
            return [
                {
                    "id":              str(row.id),
                    "room_id":         str(row.room_id),
                    "sender_id":       str(row.sender_id) if row.sender_id else None,
                    "sender_username": row.sender_username,
                    "content":         row.content,
                    "message_type":    row.message_type,
                    "sent_at":         row.sent_at.isoformat() if row.sent_at else None,
                }
                for row in reversed(rows)
            ]
        except Exception as e:
            print(f"[WS] History fetch failed: {e}")
            return []


manager = ConnectionManager()
