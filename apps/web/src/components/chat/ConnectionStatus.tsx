"use client";

import type { ConnectionState } from "@chatapp/shared-types";

interface ConnectionStatusProps {
  state: ConnectionState;
}

const CONFIG: Record<ConnectionState, { label: string; color: string; pulse: boolean }> = {
  idle:         { label: "Not connected",  color: "#6b7280", pulse: false },
  connecting:   { label: "Connecting",     color: "#f59e0b", pulse: true  },
  open:         { label: "Connected",      color: "#22c55e", pulse: false },
  reconnecting: { label: "Reconnecting",   color: "#f59e0b", pulse: true  },
  closed:       { label: "Disconnected",   color: "#6b7280", pulse: false },
  failed:       { label: "Failed",         color: "#ef4444", pulse: false },
};

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const cfg = CONFIG[state] ?? CONFIG.closed;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{
        width:        "7px",
        height:       "7px",
        borderRadius: "50%",
        background:   cfg.color,
        animation:    cfg.pulse ? "statusPulse 1.5s ease-in-out infinite" : "none",
      }} />
      <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
        {cfg.label}
      </span>
      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}