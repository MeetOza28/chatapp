"use client";

import { useEffect, useState }  from "react";
import { usePathname }          from "next/navigation";
import { Plus }                 from "lucide-react";
import type { Room }            from "@chatapp/shared-types";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton }                from "@/components/ui/skeleton";
import { Button }                  from "@/components/ui/button";
import { RoomList }                from "@/components/rooms/RoomList";
import { CreateRoomDialog }        from "@/components/rooms/CreateRoomDialog";
import { apiGet }                  from "@/lib/api-client";

export function RoomsPageClient() {
  const pathname = usePathname();
  const [rooms,      setRooms]      = useState<Room[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchRooms() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<Room[]>("/api/rooms");
      setRooms(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRooms(); }, []);

  const match      = pathname.match(/\/rooms\/([^/]+)/);
  const activeRoom = match?.[1] ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "16px", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <h2 style={{ fontWeight: "700", fontSize: "15px", color: "hsl(var(--foreground))" }}>Rooms</h2>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          style={{ width: "28px", height: "28px", padding: 0, borderRadius: "8px", background: "linear-gradient(135deg, #667eea, #764ba2)", border: "none", color: "#fff" }}
          aria-label="Create new room"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {loading && (
          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1,2,3,4].map(i => <Skeleton key={i} style={{ height: "64px", borderRadius: "10px" }} />)}
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: "12px" }}>
            <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={fetchRooms}>Retry</Button>
          </div>
        )}

        {!loading && !error && (
          <RoomList rooms={rooms} activeRoomId={activeRoom} />
        )}
      </div>

      <CreateRoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(room) => { setRooms(prev => [room, ...prev]); }}
      />
    </div>
  );
}