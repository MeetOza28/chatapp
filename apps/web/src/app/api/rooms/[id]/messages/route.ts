import { NextRequest, NextResponse } from "next/server";
import { db } from "@chatapp/db";
import { message, room, roomMember, user } from "@chatapp/db/drizzle/schema";
import { eq, desc, sql, and } from "@chatapp/db";
import { requireSession } from "@/lib/session";
import { randomUUID } from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSession();
  const { id }  = await params;
  const limit   = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50"), 100);

  const rows = await db
    .select({
      id:             message.id,
      roomId:         message.roomId,
      senderId:       message.senderId,
      senderUsername: user.username,
      content:        message.content,
      messageType:    message.messageType,
      sentAt:         message.sentAt,
    })
    .from(message)
    .leftJoin(user, eq(user.id, message.senderId))
    .where(eq(message.roomId, id))
    .orderBy(desc(message.sentAt))
    .limit(limit);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(message)
    .where(eq(message.roomId, id));

  // Return in ascending order (oldest first)
  const messages = rows.reverse().map(r => ({
    id:             r.id,
    roomId:         r.roomId,
    senderId:       r.senderId,
    senderUsername:
      r.senderId === null && r.messageType === "ai"
        ? "AI Assistant"
        : r.senderUsername ?? "deleted user",
    content:        r.content,
    messageType:    r.messageType,
    sentAt:         r.sentAt,
  }));

  return NextResponse.json({ messages, total: countRow?.count ?? 0 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const { id } = await params;
  const body = await req.json().catch(() => null) as { content?: unknown } | null;
  const rawContent = typeof body?.content === "string" ? body.content : "";
  const content = rawContent.trim();

  if (!content) {
    return NextResponse.json({ detail: "Content cannot be empty" }, { status: 400 });
  }

  const [existingRoom] = await db.select().from(room).where(eq(room.id, id)).limit(1);
  if (!existingRoom) {
    return NextResponse.json({ detail: "Room not found" }, { status: 404 });
  }

  const [member] = await db
    .select()
    .from(roomMember)
    .where(and(eq(roomMember.roomId, id), eq(roomMember.userId, session.user.id)))
    .limit(1);

  if (!member) {
    return NextResponse.json({ detail: "Not a room member" }, { status: 403 });
  }

  const sentAt = new Date().toISOString();
  const messageId = randomUUID();
  const senderUsername = session.user.username ?? session.user.name ?? "anonymous";

  await db.insert(message).values({
    id: messageId,
    roomId: id,
    senderId: session.user.id,
    content,
    messageType: "text",
  });

  return NextResponse.json({
    id: messageId,
    roomId: id,
    senderId: session.user.id,
    senderUsername,
    content,
    messageType: "text",
    sentAt,
  });
}