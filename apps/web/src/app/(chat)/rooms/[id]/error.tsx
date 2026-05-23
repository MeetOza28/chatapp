"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldX, DoorOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoomErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RoomError({ error, reset }: RoomErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Room Error]", error);
  }, [error]);

  const isNotFound  = error.message?.toLowerCase().includes("not found");
  const isNotMember = error.message?.toLowerCase().includes("not a member");

  // ── Room not found ─────────────────────────────────────────
  if (isNotFound) {
    return (
      <div style={{
        flex:           1,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexDirection:  "column",
        gap:            "16px",
        padding:        "40px",
        background:     "hsl(var(--background))",
      }}>
        <div style={{
          width:          "72px",
          height:         "72px",
          borderRadius:   "20px",
          background:     "hsl(var(--muted))",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "32px" }}>🔍</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "hsl(var(--foreground))" }}>
          Room not found
        </h2>
        <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", textAlign: "center", maxWidth: "300px" }}>
          This room doesn&apos;t exist or may have been deleted.
        </p>
        <Button
          onClick={() => router.push("/rooms")}
          style={{
            background:   "linear-gradient(135deg, #667eea, #764ba2)",
            border:       "none",
            color:        "#fff",
            borderRadius: "10px",
          }}
        >
          Browse rooms
        </Button>
      </div>
    );
  }

  // ── Not a member ───────────────────────────────────────────
  if (isNotMember) {
    return (
      <div style={{
        flex:           1,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexDirection:  "column",
        gap:            "16px",
        padding:        "40px",
        background:     "hsl(var(--background))",
      }}>
        <div style={{
          width:          "72px",
          height:         "72px",
          borderRadius:   "20px",
          background:     "hsl(var(--destructive) / 0.1)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}>
          <ShieldX style={{ width: "32px", height: "32px", color: "hsl(var(--destructive))" }} />
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "hsl(var(--foreground))" }}>
          Access denied
        </h2>
        <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", textAlign: "center", maxWidth: "300px" }}>
          You are not a member of this room. Join the room first to start chatting.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            variant="outline"
            onClick={() => router.push("/rooms")}
            style={{ borderRadius: "10px" }}
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  // ── Generic room error ────────────────────────────────────
  return (
    <div style={{
      flex:           1,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      flexDirection:  "column",
      gap:            "16px",
      padding:        "40px",
      background:     "hsl(var(--background))",
    }}>
      <div style={{
        width:          "72px",
        height:         "72px",
        borderRadius:   "20px",
        background:     "hsl(var(--destructive) / 0.1)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}>
        <DoorOpen style={{ width: "32px", height: "32px", color: "hsl(var(--destructive))" }} />
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "hsl(var(--foreground))" }}>
        Could not load room
      </h2>
      <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", textAlign: "center", maxWidth: "320px" }}>
        {error.message || "An unexpected error occurred while loading this room."}
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <Button
          onClick={reset}
          style={{
            background:   "linear-gradient(135deg, #667eea, #764ba2)",
            border:       "none",
            color:        "#fff",
            borderRadius: "10px",
            display:      "flex",
            alignItems:   "center",
            gap:          "6px",
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/rooms")}
          style={{ borderRadius: "10px" }}
        >
          Browse rooms
        </Button>
      </div>
    </div>
  );
}