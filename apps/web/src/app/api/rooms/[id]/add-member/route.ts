import { NextRequest, NextResponse } from "next/server";
import { db } from "@chatapp/db";
import { room, roomMember, user } from "@chatapp/db/drizzle/schema";
import { eq, and } from "@chatapp/db";
import { requireSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session   = await requireSession();
  const currentId = session.user.id;
  const { id }    = await params;
  const body      = await req.json();
  const targetId  = body.user_id as string;

  // Only room owner can add members
  const [r] = await db.select().from(room).where(eq(room.id, id)).limit(1);
  if (!r) return NextResponse.json({ detail: "Room not found" }, { status: 404 });
  if (r.ownerId !== currentId) return NextResponse.json({ detail: "Only room owner can add members" }, { status: 403 });

  // Check target user exists
  const [u] = await db.select().from(user).where(eq(user.id, targetId)).limit(1);
  if (!u) return NextResponse.json({ detail: "User not found" }, { status: 404 });

  // Check not already a member
  const [existing] = await db
    .select()
    .from(roomMember)
    .where(and(eq(roomMember.roomId, id), eq(roomMember.userId, targetId)))
    .limit(1);

  if (existing) return NextResponse.json({ message: "User is already a member", room_id: id, user_id: targetId });

  await db.insert(roomMember).values({ roomId: id, userId: targetId });

  return NextResponse.json({ message: "Member added successfully", room_id: id, user_id: targetId });
}