"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession }        from "@/lib/auth-client";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { buildWsUrl, readyStateToStr } from "@/hooks/useWebSocket";
import { ChatWindow }        from "@/components/chat/ChatWindow";
import type { Message, WsIncoming, WsMessage } from "@chatapp/shared-types";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  for (const cookie of document.cookie.split(";")) {
    const [name, value] = cookie.trim().split("=");
    if (name === "chatapp.session_token") {
      const decoded = decodeURIComponent(value ?? "");
      return decoded.includes(".") ? decoded.split(".")[0]! : decoded;
    }
  }
  return null;
}

interface Props { roomId: string; userId: string; username: string; }

export function ChatPageClient({ roomId, userId, username }: Props) {
  const { data: session } = useSession();
  const token = session?.session?.token ?? getTokenFromCookie();

  const [messages,    setMessages]    = useState<Record<string, WsMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  const activeRoomRef = useRef(roomId);
  const prevRoomRef   = useRef<string | null>(null);
  const typingTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { activeRoomRef.current = roomId; }, [roomId]);

  const wsUrl = token ? buildWsUrl(token) : null;

  // share:true — reuses the SAME socket created in layout.tsx
  // same URL = same socket, no new connection created
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    wsUrl,
    {
      share: true,
      shouldReconnect: () => true,
      onOpen: () => {
        if (activeRoomRef.current) {
          sendJsonMessage({ type: "join_room", room_id: activeRoomRef.current });
        }
      },
    },
    !!token,
  );

  // Process incoming messages
  useEffect(() => {
    const data = lastJsonMessage as WsIncoming | null;
    if (!data) return;

    if (data.type === "ping") { sendJsonMessage({ type: "pong" }); return; }

    const room = "room_id" in data && data.room_id
      ? data.room_id : activeRoomRef.current ?? "";

    switch (data.type) {
      case "history":
        setMessages(prev => ({ ...prev, [data.room_id]: data.messages }));
        break;
      case "message":
        setMessages(prev => {
          const ex = prev[data.room_id] ?? [];
          if (ex.some(m => m.id === data.id)) return prev;
          return { ...prev, [data.room_id]: [...ex, data] };
        });
        break;
      case "typing":
        setTypingUsers(prev => {
          const list = prev[room] ?? [];
          if (data.is_typing) {
            if (list.includes(data.username)) return prev;
            return { ...prev, [room]: [...list, data.username] };
          }
          return { ...prev, [room]: list.filter(u => u !== data.username) };
        });
        break;
    }
  }, [lastJsonMessage]);

  // Switch room — leave old, join new — over the SAME shared socket
  useEffect(() => {
    if (readyState !== ReadyState.OPEN || !roomId) return;
    const prev = prevRoomRef.current;
    if (prev && prev !== roomId) sendJsonMessage({ type: "leave_room", room_id: prev });
    prevRoomRef.current = roomId;
    sendJsonMessage({ type: "join_room", room_id: roomId });
  }, [roomId, readyState]);

  const sendMessage = useCallback((content: string) => {
    if (!roomId || !content.trim()) return;
    sendJsonMessage({ type: "message", room_id: roomId, content: content.trim() });
  }, [roomId, sendJsonMessage]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!roomId) return;
    sendJsonMessage({ type: "typing", room_id: roomId, is_typing: isTyping });
    if (isTyping) {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        sendJsonMessage({ type: "typing", room_id: roomId, is_typing: false });
      }, 3000);
    }
  }, [roomId, sendJsonMessage]);

  const msgs: Message[] = (messages[roomId] ?? []).map(m => ({
    id: m.id, roomId: m.room_id, senderId: m.sender_id,
    senderUsername: m.sender_username, content: m.content,
    messageType: m.message_type, sentAt: m.sent_at,
  }));

  return (
    <ChatWindow
      roomId={roomId}
      currentUserId={userId}
      currentUsername={username}
      messages={msgs}
      typingUsers={typingUsers[roomId] ?? []}
      historyLoaded={msgs.length > 0 || readyState === ReadyState.OPEN}
      connectionState={readyStateToStr(readyState)}
      isConnected={readyState === ReadyState.OPEN}
      queueSize={0}
      onSend={sendMessage}
      onTyping={sendTyping}
    />
  );
}