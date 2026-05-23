"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Send, WifiOff, Clock }            from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ConnectionState } from "@chatapp/shared-types";

interface MessageInputProps {
  onSend:          (content: string) => void;
  onTyping:        () => void;
  isConnected:     boolean;
  connectionState: ConnectionState;
  queueSize?:      number;
}

export function MessageInput({
  onSend,
  onTyping,
  isConnected,
  connectionState,
  queueSize = 0,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty    = content.trim().length === 0;
  const charCount  = content.length;
  const overLimit  = charCount > 1800;

  function handleSend() {
    if (isEmpty || charCount > 2000) return;
    onSend(content.trim());
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    onTyping();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxH = 4 * 24 + 24;
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, maxH) + "px";
    }
  }

  const connectionLabel =
    connectionState === "connecting"   ? "Connecting..." :
    connectionState === "reconnecting" ? "Reconnecting..." :
    connectionState === "failed"       ? "Disconnected — refresh page" :
    null;

  const helperText = isConnected
    ? "Press ⌘ Enter to send"
    : "WebSocket is unavailable — messages will send through the API fallback";

  return (
    <div style={{
      padding:    "12px 20px 16px",
      borderTop:  "1px solid hsl(var(--border))",
      background: "hsl(var(--card))",
      flexShrink: 0,
    }}>

      {/* Connection banner */}
      {connectionLabel && (
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "6px",
          marginBottom: "8px",
          padding:      "6px 10px",
          borderRadius: "8px",
          background:   "hsl(var(--muted))",
          fontSize:     "12px",
          color:        "hsl(var(--muted-foreground))",
        }}>
          <WifiOff className="h-3.5 w-3.5" />
          {connectionLabel}
        </div>
      )}

      {/* Queued messages banner */}
      {queueSize > 0 && (
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "6px",
          marginBottom: "8px",
          padding:      "6px 10px",
          borderRadius: "8px",
          background:   "hsl(var(--accent))",
          fontSize:     "12px",
          color:        "hsl(var(--accent-foreground))",
        }}>
          <Clock className="h-3.5 w-3.5" />
          {queueSize} message{queueSize > 1 ? "s" : ""} queued — will send when reconnected
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected
                ? "Type a message... (⌘ Enter to send)"
                : "Type a message... (sends through fallback)"
            }
            rows={1}
            style={{
              resize:       "none",
              overflow:     "hidden",
              borderRadius: "12px",
              paddingRight: charCount > 100 ? "56px" : "12px",
              fontSize:     "14px",
              lineHeight:   "1.5",
              minHeight:    "42px",
              border:       overLimit
                ? "1px solid hsl(var(--destructive))"
                : "1px solid hsl(var(--border))",
              transition:   "border-color 0.15s",
              background:   "hsl(var(--background))",
              color:        "hsl(var(--foreground))",
            }}
          />

          {charCount > 100 && (
            <span style={{
              position:  "absolute",
              right:     "10px",
              bottom:    "10px",
              fontSize:  "11px",
              color:     overLimit
                ? "hsl(var(--destructive))"
                : "hsl(var(--muted-foreground))",
              fontVariantNumeric: "tabular-nums",
            }}>
              {charCount}/2000
            </span>
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={isEmpty || charCount > 2000}
          aria-label="Send message"
          style={{
            width:        "42px",
            height:       "42px",
            padding:      0,
            borderRadius: "12px",
            flexShrink:   0,
            background:   isEmpty || charCount > 2000
              ? "hsl(var(--muted))"
              : "linear-gradient(135deg, #667eea, #764ba2)",
            border:       "none",
            color:        isEmpty || charCount > 2000
              ? "hsl(var(--muted-foreground))"
              : "#fff",
            transition:   "all 0.15s",
            boxShadow:    isEmpty || charCount > 2000
              ? "none"
              : "0 2px 8px rgba(102,126,234,0.35)",
          }}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p style={{
        fontSize:  "11px",
        color:     "hsl(var(--muted-foreground))",
        marginTop: "6px",
        textAlign: "right",
      }}>
        {isConnected ? (
          <>Press <kbd style={{
            padding:      "1px 4px",
            borderRadius: "4px",
            background:   "hsl(var(--muted))",
            fontSize:     "10px",
            fontFamily:   "monospace",
          }}>⌘ Enter</kbd> to send</>
        ) : helperText}
      </p>
    </div>
  );
}