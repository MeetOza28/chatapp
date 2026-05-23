import { NextRequest, NextResponse } from "next/server";
import { db } from "@chatapp/db";
import { room, roomMember } from "@chatapp/db/drizzle/schema";
import { eq, and } from "@chatapp/db";
import { requireSession } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const userId  = session.user.id;
  const { id }  = await params;

  // Verify room exists
  const [r] = await db.select().from(room).where(eq(room.id, id)).limit(1);
  if (!r) {
    return NextResponse.json({ detail: "Room not found" }, { status: 404 });
  }

  // Check if already a member
  const [existing] = await db
    .select()
    .from(roomMember)
    .where(and(eq(roomMember.roomId, id), eq(roomMember.userId, userId)))
    .limit(1);

  if (!existing) {
    await db.insert(roomMember).values({ roomId: id, userId });
  }

  return NextResponse.json({ message: "Joined successfully", room_id: id, user_id: userId });
}