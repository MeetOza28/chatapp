import { NextRequest, NextResponse } from "next/server";
import { db } from "@chatapp/db";
import { room, roomMember, user } from "@chatapp/db/drizzle/schema";
import { eq, notInArray, ne } from "@chatapp/db";
import { requireSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session   = await requireSession();
  const currentId = session.user.id;
  const { id }    = await params;

  // Only room owner can see this
  const [r] = await db.select().from(room).where(eq(room.id, id)).limit(1);
  if (!r) return NextResponse.json({ detail: "Room not found" }, { status: 404 });
  if (r.ownerId !== currentId) return NextResponse.json({ detail: "Only room owner can add members" }, { status: 403 });

  // Get current member IDs
  const members = await db
    .select({ userId: roomMember.userId })
    .from(roomMember)
    .where(eq(roomMember.roomId, id));

  const memberIds = members.map((m: { userId: string }) => m.userId);

  // Get users NOT in this room (excluding current user)
  const available = memberIds.length > 0
    ? await db
        .select({ id: user.id, username: user.username, name: user.name })
        .from(user)
        .where(notInArray(user.id, memberIds))
    : await db
        .select({ id: user.id, username: user.username, name: user.name })
        .from(user)
        .where(ne(user.id, currentId));

  return NextResponse.json(
    available.map((u: { id: string; username?: string | null; name?: string | null }) => ({
      id:       u.id,
      username: u.username ?? "anonymous",
      name:     u.name,
    }))
  );
}