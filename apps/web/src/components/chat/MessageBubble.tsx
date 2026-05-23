"use client";

import { Bot }   from "lucide-react";
import type { Message } from "@chatapp/shared-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sanitizeMessage } from "@/lib/sanitize";

interface MessageBubbleProps {
  message:    Message;
  isOwn:      boolean;
  showAvatar: boolean;
}

function formatTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

function getInitials(username: string): string {
  return username.split(/[\s_-]/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  const safe = sanitizeMessage(message.content);

  if (message.messageType === "system") {
    return <div style={{ textAlign: "center", padding: "4px 0", fontSize: "12px", color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>{safe}</div>;
  }

  if (message.messageType === "ai") {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "2px 0" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #11998e, #38ef7d)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bot style={{ width: "16px", height: "16px", color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "hsl(var(--muted-foreground))", marginBottom: "3px" }}>AI Assistant</div>
          <div style={{ background: "linear-gradient(135deg, rgba(17,153,142,0.1), rgba(56,239,125,0.1))", border: "1px solid rgba(17,153,142,0.2)", borderRadius: "4px 14px 14px 14px", padding: "8px 12px", fontSize: "14px", lineHeight: "1.5", maxWidth: "480px" }}>{safe}</div>
          <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginTop: "4px" }}>{formatTime(message.sentAt)}</div>
        </div>
      </div>
    );
  }

  if (isOwn) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "1px 0" }}>
        <div style={{ maxWidth: "480px" }}>
          <div style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", borderRadius: "14px 4px 14px 14px", padding: "8px 12px", fontSize: "14px", color: "#fff", lineHeight: "1.5", wordBreak: "break-word", boxShadow: "0 2px 8px rgba(102,126,234,0.3)" }}>{safe}</div>
          <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", textAlign: "right", marginTop: "3px" }}>{formatTime(message.sentAt)}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "1px 0" }}>
      <div style={{ width: "32px", flexShrink: 0 }}>
        {showAvatar && (
          <Avatar style={{ width: "32px", height: "32px" }}>
            <AvatarFallback style={{ background: `hsl(${Math.abs(message.senderUsername.split("").reduce((a,c) => a + c.charCodeAt(0), 0)) % 360}, 60%, 55%)`, color: "#fff", fontSize: "11px", fontWeight: "600" }}>
              {getInitials(message.senderUsername)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <div style={{ maxWidth: "480px" }}>
        {showAvatar && <div style={{ fontSize: "12px", fontWeight: "600", color: "hsl(var(--foreground))", marginBottom: "3px" }}>{message.senderUsername}</div>}
        <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: showAvatar ? "4px 14px 14px 14px" : "14px", padding: "8px 12px", fontSize: "14px", lineHeight: "1.5", wordBreak: "break-word" }}>{safe}</div>
        <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginTop: "3px" }}>{formatTime(message.sentAt)}</div>
      </div>
    </div>
  );
}