import { NextRequest, NextResponse } from "next/server";
import { db } from "@chatapp/db";
import { room, roomMember, message, user } from "@chatapp/db/drizzle/schema";
import { eq, desc, sql } from "@chatapp/db";
import { requireSession } from "@/lib/session";
import { headers } from "next/headers";
import { randomUUID } from "crypto";

// GET /api/rooms — fetch all rooms the current user is a member of
export async function GET() {
  const session = await requireSession();
  const userId  = session.user.id;

  // Get rooms where user is a member
  const rows = await db
    .select({
      id:        room.id,
      name:      room.name,
      ownerId:   room.ownerId,
      createdAt: room.createdAt,
    })
    .from(room)
    .innerJoin(roomMember, eq(roomMember.roomId, room.id))
    .where(eq(roomMember.userId, userId))
    .orderBy(desc(room.createdAt));

  // For each room get member count + last message
  const result = await Promise.all(
    rows.map(async (r) => {
      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(roomMember)
        .where(eq(roomMember.roomId, r.id));

      const [lastMsg] = await db
        .select({
          content:        message.content,
          senderId:       message.senderId,
          messageType:    message.messageType,
          senderUsername: user.username,
          sentAt:         message.sentAt,
        })
        .from(message)
        .leftJoin(user, eq(user.id, message.senderId))
        .where(eq(message.roomId, r.id))
        .orderBy(desc(message.sentAt))
        .limit(1);

      return {
        id:          r.id,
        name:        r.name,
        ownerId:     r.ownerId,
        createdAt:   r.createdAt,
        memberCount: countRow?.count ?? 0,
        lastMessage: lastMsg
          ? {
              content:        lastMsg.content,
              senderUsername:
                lastMsg.senderId === null && lastMsg.messageType === "ai"
                  ? "AI Assistant"
                  : lastMsg.senderUsername ?? "deleted user",
              sentAt:         lastMsg.sentAt,
            }
          : null,
      };
    })
  );

  return NextResponse.json(result);
}

// POST /api/rooms — create a new room
export async function POST(req: NextRequest) {
  const session = await requireSession();
  const userId  = session.user.id;
  const body    = await req.json();
  const name    = (body.name as string)?.trim();

  if (!name) {
    return NextResponse.json({ detail: "Room name is required" }, { status: 400 });
  }

  // Check if room name already exists
  const [existing] = await db
    .select({ id: room.id })
    .from(room)
    .where(eq(room.name, name))
    .limit(1);

  if (existing) {
    return NextResponse.json({ detail: `A room named '${name}' already exists` }, { status: 409 });
  }

  // Create room
  const roomId = randomUUID();
  const [newRoom] = await db
    .insert(room)
    .values({ id: roomId, name, ownerId: userId })
    .returning();

  // Auto-add creator as member
  await db
    .insert(roomMember)
    .values({ roomId, userId });

  return NextResponse.json(
    { id: newRoom!.id, name: newRoom!.name, ownerId: newRoom!.ownerId, createdAt: newRoom!.createdAt, memberCount: 1 },
    { status: 201 }
  );
}