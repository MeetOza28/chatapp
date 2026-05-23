import { NextRequest, NextResponse } from "next/server";
import { db } from "@chatapp/db";
import { roomMember, user } from "@chatapp/db/drizzle/schema";
import { eq, asc } from "@chatapp/db";
import { requireSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSession();
  const { id } = await params;

  const rows = await db
    .select({
      id:       user.id,
      username: user.username,
      name:     user.name,
      joinedAt: roomMember.joinedAt,
    })
    .from(roomMember)
    .innerJoin(user, eq(user.id, roomMember.userId))
    .where(eq(roomMember.roomId, id))
    .orderBy(asc(roomMember.joinedAt));

  return NextResponse.json(
    rows.map(r => ({
      id:       r.id,
      username: r.username ?? "anonymous",
      name:     r.name,
      joinedAt: r.joinedAt,
    }))
  );
}