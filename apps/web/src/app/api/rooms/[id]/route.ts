import { NextRequest, NextResponse } from "next/server";
import { db } from "@chatapp/db";
import { room, roomMember, message, user } from "@chatapp/db/drizzle/schema";
import { eq, desc, sql } from "@chatapp/db";
import { requireSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSession();
  const { id } = await params;

  const [r] = await db
    .select()
    .from(room)
    .where(eq(room.id, id))
    .limit(1);

  if (!r) {
    return NextResponse.json({ detail: "Room not found" }, { status: 404 });
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(roomMember)
    .where(eq(roomMember.roomId, id));

  const [lastMsg] = await db
    .select({
      content:        message.content,
      senderUsername: user.username,
      sentAt:         message.sentAt,
    })
    .from(message)
    .leftJoin(user, eq(user.id, message.senderId))
    .where(eq(message.roomId, id))
    .orderBy(desc(message.sentAt))
    .limit(1);

  return NextResponse.json({
    id:          r.id,
    name:        r.name,
    ownerId:     r.ownerId,
    createdAt:   r.createdAt,
    memberCount: countRow?.count ?? 0,
    lastMessage: lastMsg
      ? {
          content:        lastMsg.content,
          senderUsername: lastMsg.senderUsername ?? "deleted user",
          sentAt:         lastMsg.sentAt,
        }
      : null,
  });
}