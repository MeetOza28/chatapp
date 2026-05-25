"use client";

import { useCallback, useEffect, useRef } from "react";
import { useChatContext } from "@/context/ChatContext";
import { ChatWindow }     from "@/components/chat/ChatWindow";
import type { Message }   from "@chatapp/shared-types";

interface Props { roomId: string; userId: string; username: string; }

export function ChatPageClient({ roomId, userId, username }: Props) {
  const {
    connectionState, isConnected,
    messages: wsMessages, typingUsers: wsTyping,
    sendJsonMessage,
  } = useChatContext();

  const joinedRoomRef = useRef<string | null>(null);
  const sendRef       = useRef(sendJsonMessage);
  sendRef.current     = sendJsonMessage;

  // Join when connected; re-join after reconnect
  useEffect(() => {
    if (!roomId || connectionState !== "open") return;

    const prev = joinedRoomRef.current;
    if (prev && prev !== roomId) {
      sendRef.current({ type: "leave_room", room_id: prev });
    }

    sendRef.current({ type: "join_room", room_id: roomId });
    joinedRoomRef.current = roomId;
  }, [roomId, connectionState]);

  const sendMessage = useCallback((content: string) => {
    if (!roomId || !content.trim()) return;
    sendJsonMessage({ type: "message", room_id: roomId, content: content.trim() });
  }, [roomId, sendJsonMessage]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!roomId) return;
    sendJsonMessage({ type: "typing", room_id: roomId, is_typing: isTyping });
  }, [roomId, sendJsonMessage]);

  const msgs: Message[] = (wsMessages[roomId] ?? []).map(m => ({
    id:             m.id,
    roomId:         m.room_id,
    senderId:       m.sender_id,
    senderUsername: m.sender_username,
    content:        m.content,
    messageType:    m.message_type,
    sentAt:         m.sent_at,
  }));

  return (
    <ChatWindow
      roomId={roomId}
      currentUserId={userId}
      currentUsername={username}
      messages={msgs}
      typingUsers={wsTyping[roomId] ?? []}
      historyLoaded={msgs.length > 0 || isConnected}
      connectionState={connectionState}
      isConnected={isConnected}
      queueSize={0}
      onSend={sendMessage}
      onTyping={sendTyping}
    />
  );
}
