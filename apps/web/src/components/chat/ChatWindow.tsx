"use client";

import { useEffect, useRef, useState } from "react";
import { Hash, Users }   from "lucide-react";
import { ScrollArea }    from "@/components/ui/scroll-area";
import { Skeleton }      from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Message, ConnectionState, WsIncoming } from "@chatapp/shared-types";

import { MessageBubble }    from "@/components/chat/MessageBubble";
import { MessageInput }     from "@/components/chat/MessageInput";
import { ConnectionStatus } from "@/components/chat/ConnectionStatus";
import { RoomMembers }      from "@/components/chat/RoomMembers";
import { apiGet }           from "@/lib/api-client";
import type { MessagesResponse } from "@chatapp/shared-types";

interface ChatWindowProps {
  roomId:          string;
  currentUserId:   string;
  currentUsername: string;
  messages:        Message[];
  typingUsers:     string[];
  historyLoaded:   boolean;
  connectionState: ConnectionState;
  isConnected:     boolean;
  queueSize:       number;
  onSend:          (content: string) => void;
  onTyping:        (isTyping: boolean) => void;
}

export function ChatWindow({
  roomId, currentUserId, currentUsername,
  messages, typingUsers, historyLoaded,
  connectionState, isConnected, queueSize,
  onSend, onTyping,
}: ChatWindowProps) {
  const [roomName,    setRoomName]    = useState("");
  const [ownerId,     setOwnerId]     = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRoomName(""); setError(null);
    apiGet<{ id: string; name: string; ownerId: string | null }>(`/api/rooms/${roomId}`)
      .then(room => { if (!cancelled) { setRoomName(room.name); setOwnerId(room.ownerId); } })
      .catch(() => { if (!cancelled) setError("Failed to load room"); });
    return () => { cancelled = true; };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(content: string) {
    onSend(content);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTyping(false);
  }

  function handleTyping() {
    onTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => onTyping(false), 3000);
  }

  if (error) return (
    <div style={{ padding: "24px" }}>
      <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%", overflow: "hidden", background: "hsl(var(--background))" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "0 20px", height: "52px", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between", background: "hsl(var(--card))", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Hash style={{ width: "14px", height: "14px", color: "#fff" }} />
            </div>
            <span style={{ fontWeight: "700", fontSize: "15px" }}>{roomName || "Loading..."}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => setShowMembers(s => !s)} style={{ background: showMembers ? "hsl(var(--accent))" : "transparent", border: "none", cursor: "pointer", padding: "6px", borderRadius: "6px", color: showMembers ? "hsl(var(--accent-foreground))" : "hsl(var(--muted-foreground))" }}>
              <Users style={{ width: "16px", height: "16px" }} />
            </button>
            <ConnectionStatus state={connectionState} />
          </div>
        </div>

        {queueSize > 0 && (
          <div style={{ padding: "6px 20px", background: "hsl(var(--accent))", fontSize: "12px", color: "hsl(var(--accent-foreground))", borderBottom: "1px solid hsl(var(--border))", flexShrink: 0 }}>
            {queueSize} message{queueSize > 1 ? "s" : ""} queued
          </div>
        )}

        <ScrollArea style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {!historyLoaded && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 0" }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-end", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start" }}>
                    {i % 2 !== 0 && <Skeleton style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0 }} />}
                    <Skeleton style={{ height: "48px", width: `${140 + i * 40}px`, borderRadius: "12px" }} />
                  </div>
                ))}
              </div>
            )}

            {historyLoaded && messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "hsl(var(--muted-foreground))" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>👋</div>
                <p style={{ fontWeight: "600", marginBottom: "4px" }}>Welcome to #{roomName}</p>
                <p style={{ fontSize: "13px" }}>This is the beginning of this room. Say hello!</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const showAvatar = !messages[idx - 1] || messages[idx - 1]!.senderId !== msg.senderId;
              return <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} showAvatar={showAvatar} />;
            })}

            {typingUsers.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", color: "hsl(var(--muted-foreground))", fontSize: "12px" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "hsl(var(--muted-foreground))", animation: `tb 1.2s ease-in-out ${i*0.15}s infinite` }} />)}
                </div>
                <span>{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <style>{`@keyframes tb{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`}</style>
        </ScrollArea>

        <MessageInput onSend={handleSend} onTyping={handleTyping} isConnected={isConnected} connectionState={connectionState} queueSize={queueSize} />
      </div>

      {showMembers && <RoomMembers roomId={roomId} isOwner={ownerId === currentUserId} ownerId={ownerId} />}
    </div>
  );
}