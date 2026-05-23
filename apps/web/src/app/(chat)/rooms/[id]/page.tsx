import { Suspense }         from "react";
import { requireSession }   from "@/lib/session";
import { RoomsPageClient }  from "@/components/rooms/RoomsPageClient";
import { RoomListSkeleton } from "@/components/skeletons/RoomListSkeleton";
import { ChatPageClient }   from "@/components/chat/ChatPageClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: Props) {
  const session  = await requireSession();
  const { id }   = await params;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <aside style={{
        width: "280px", flexShrink: 0,
        borderRight: "1px solid hsl(var(--border))",
        background: "hsl(var(--card))",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <Suspense fallback={<RoomListSkeleton />}>
          <RoomsPageClient />
        </Suspense>
      </aside>

      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <ChatPageClient
          roomId={id}
          userId={session.user.id}
          username={(session.user as any).username ?? session.user.name}
        />
      </main>
    </div>
  );
}