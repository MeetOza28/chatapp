import { Suspense }         from "react";
import { requireSession }   from "@/lib/session";
import { RoomsPageClient }  from "@/components/rooms/RoomsPageClient";
import { RoomListSkeleton } from "@/components/skeletons/RoomListSkeleton";

export const dynamic    = "force-dynamic";

export default async function RoomsPage() {
  await requireSession();

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

      {/* Sidebar */}
      <aside style={{
        width:         "280px",
        flexShrink:    0,
        borderRight:   "1px solid hsl(var(--border))",
        background:    "hsl(var(--card))",
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
      }}>
        <Suspense fallback={<RoomListSkeleton />}>
          <RoomsPageClient />
        </Suspense>
      </aside>

      {/* Empty state */}
      <main style={{
        flex:           1,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexDirection:  "column",
        gap:            "12px",
        background:     "hsl(var(--background))",
      }}>
        <div style={{
          width:         "64px",
          height:        "64px",
          borderRadius:  "16px",
          background:    "hsl(var(--accent))",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
        }}>
          <span style={{ fontSize: "28px" }}>💬</span>
        </div>
        <p style={{ fontSize: "16px", fontWeight: "600", color: "hsl(var(--foreground))" }}>
          Select a room to start chatting
        </p>
        <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))" }}>
          Or create a new room using the + button
        </p>
      </main>
    </div>
  );
}