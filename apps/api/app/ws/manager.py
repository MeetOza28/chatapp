"""
WebSocket manager — ONE connection per user. In-memory only (no Redis).
"""

import asyncio
import json
from typing import Optional
from fastapi import WebSocket
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

MAX_CONNECTIONS     = 10000
HEARTBEAT_INTERVAL  = 30
RATE_LIMIT_MESSAGES = 20
RATE_LIMIT_WINDOW   = 10


class ConnectionManager:

    def __init__(self):
        self.connections:      dict[str, WebSocket]      = {}
        self.user_names:       dict[str, str]            = {}
        self.user_rooms:       dict[str, Optional[str]]  = {}
        self.room_members:     dict[str, set[str]]       = {}
        self._heartbeat_tasks: dict[str, asyncio.Task]   = {}

    async def connect(self, websocket: WebSocket, user_id: str, username: str) -> bool:
        if len(self.connections) >= MAX_CONNECTIONS:
            await websocket.close(code=4029, reason="Server at capacity")
            return False

        old_ws   = self.connections.get(user_id)
        old_room = self.user_rooms.get(user_id)

        if old_ws:
            task = self._heartbeat_tasks.pop(user_id, None)
            if task and not task.done():
                task.cancel()
            if old_room:
                self._remove_from_room(user_id, old_room)
            self.connections.pop(user_id, None)
            self.user_names.pop(user_id, None)
            self.user_rooms.pop(user_id, None)

        await websocket.accept()

        if old_ws:
            try:
                asyncio.create_task(old_ws.close(1000, "Replaced by new connection"))
            except Exception:
                pass

        self.connections[user_id] = websocket
        self.user_names[user_id]  = username
        self.user_rooms[user_id]  = None

        task = asyncio.create_task(self._heartbeat(websocket, user_id))
        self._heartbeat_tasks[user_id] = task
        return True

    async def disconnect(self, user_id: str) -> None:
        task = self._heartbeat_tasks.pop(user_id, None)
        if task and not task.done():
            task.cancel()

        current_room = self.user_rooms.get(user_id)
        if current_room:
            self._remove_from_room(user_id, current_room)

        self.connections.pop(user_id, None)
        self.user_names.pop(user_id, None)
        self.user_rooms.pop(user_id, None)

    async def join_room(self, user_id: str, room_id: str, db: AsyncSession) -> None:
        username  = self.user_names.get(user_id, "unknown")
        prev_room = self.user_rooms.get(user_id)

        if prev_room and prev_room != room_id:
            self._remove_from_room(user_id, prev_room)
            await self.broadcast_to_room(prev_room, {
                "type": "presence", "user_id": user_id,
                "username": username, "status": "offline",
            })

        if room_id not in self.room_members:
            self.room_members[room_id] = set()
        self.room_members[room_id].add(user_id)
        self.user_rooms[user_id] = room_id

        ws = self.connections.get(user_id)
        if ws:
            history = await self._fetch_history(room_id, db)
            await self._send(ws, {
                "type": "history", "room_id": room_id, "messages": history,
            })
            online = self._get_online_users(room_id)
            await self._send(ws, {
                "type": "online_users", "room_id": room_id, "users": online,
            })

        await self.broadcast_to_room(room_id, {
            "type": "presence", "user_id": user_id,
            "username": username, "status": "online",
        })

    async def leave_room(self, user_id: str, room_id: str) -> None:
        username = self.user_names.get(user_id, "unknown")
        self._remove_from_room(user_id, room_id)
        if self.user_rooms.get(user_id) == room_id:
            self.user_rooms[user_id] = None
        await self.broadcast_to_room(room_id, {
            "type": "presence", "user_id": user_id,
            "username": username, "status": "offline",
        })

    async def broadcast_to_room(
        self, room_id: str, message: dict, exclude_user_id: Optional[str] = None
    ) -> None:
        members = self.room_members.get(room_id, set()).copy()
        dead: list[str] = []
        for uid in members:
            if uid == exclude_user_id:
                continue
            ws = self.connections.get(uid)
            if ws:
                ok = await self._send(ws, message)
                if not ok:
                    dead.append(uid)
        for uid in dead:
            await self.disconnect(uid)

    async def send_to_user(self, user_id: str, message: dict) -> bool:
        ws = self.connections.get(user_id)
        if ws:
            return await self._send(ws, message)
        return False

    async def check_rate_limit(self, user_id: str, room_id: str) -> bool:
        return True  # No Redis — rate limiting disabled

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

    async def _heartbeat(self, websocket: WebSocket, user_id: str) -> None:
        try:
            while True:
                await asyncio.sleep(HEARTBEAT_INTERVAL)
                ok = await self._send(websocket, {"type": "ping"})
                if not ok:
                    await self.disconnect(user_id)
                    break
        except asyncio.CancelledError:
            pass

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