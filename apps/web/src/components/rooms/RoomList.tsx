"use client";

import { useState }    from "react";
import { useRouter }   from "next/navigation";
import { Hash, Users } from "lucide-react";
import type { Room }   from "@chatapp/shared-types";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface RoomListProps {
  rooms:        Room[];
  activeRoomId: string | null;
}

export function RoomList({ rooms, activeRoomId }: RoomListProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "10px 12px", flexShrink: 0 }}>
        <Input placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: "34px", fontSize: "13px", borderRadius: "8px" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px" }}>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", fontSize: "13px", color: "hsl(var(--muted-foreground))", padding: "24px 0" }}>
            {search ? "No rooms match" : "No rooms yet"}
          </p>
        )}

        {filtered.map(room => {
          const isActive = room.id === activeRoomId;
          return (
            <button
              key={room.id}
              onClick={() => router.push(`/rooms/${room.id}`)}
              style={{
                width: "100%", textAlign: "left", padding: "10px 12px",
                borderRadius: "10px", border: "none", cursor: "pointer", marginBottom: "2px",
                transition: "background 0.15s",
                background: isActive ? "linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))" : "transparent",
                display: "flex", alignItems: "center", gap: "10px",
              }}
              className={isActive ? "" : "hover:bg-accent"}
            >
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                background: isActive ? "linear-gradient(135deg, #667eea, #764ba2)" : "hsl(var(--secondary))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Hash style={{ width: "16px", height: "16px", color: isActive ? "#fff" : "hsl(var(--muted-foreground))" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: isActive ? "hsl(var(--primary))" : "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {room.name}
                  </span>
                  <Badge variant="secondary" style={{ fontSize: "10px", padding: "0 5px", height: "18px", flexShrink: 0 }}>
                    <Users className="h-2.5 w-2.5 mr-1" />{room.memberCount}
                  </Badge>
                </div>
                {room.lastMessage ? (
                  <p style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                    <span style={{ fontWeight: "500" }}>{room.lastMessage.senderUsername}: </span>
                    {room.lastMessage.content}
                  </p>
                ) : (
                  <p style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginTop: "2px", fontStyle: "italic" }}>No messages yet</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}