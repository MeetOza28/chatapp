"use client";

import {
  createContext, useCallback, useContext,
  useEffect, useMemo, useState,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { buildWsUrl, readyStateToStr } from "@/hooks/useWebSocket";
import { useSession }                  from "@/lib/auth-client";
import type { ConnectionState }        from "@/hooks/useWebSocket";
import type { WsIncoming, WsMessage }  from "@chatapp/shared-types";

interface ChatContextValue {
  connectionState: ConnectionState;
  isConnected:     boolean;
  messages:        Record<string, WsMessage[]>;
  typingUsers:     Record<string, string[]>;
  sendJsonMessage: (msg: object) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be inside ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [messages,    setMessages]    = useState<Record<string, WsMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  const token = session?.session?.token;

  // Stable token: keep WS URL during session refetch (refresh must not set url to null)
  const [wsToken, setWsToken] = useState<string | null>(null);
  useEffect(() => {
    if (token) {
      setWsToken(token);
    } else if (!isPending && !session) {
      setWsToken(null);
    }
  }, [token, isPending, session]);

  const socketUrl = useMemo(
    () => (wsToken ? buildWsUrl(wsToken) : null),
    [wsToken],
  );

  const {
    sendJsonMessage,
    lastJsonMessage,
    readyState,
  } = useWebSocket(socketUrl, {
    shouldReconnect: (e) => e.code !== 4001,
    reconnectAttempts: 10,
    reconnectInterval: 2000,
    retryOnError: true,
  });

  useEffect(() => {
    const data = lastJsonMessage as WsIncoming | null;
    if (!data) return;

    const room = "room_id" in data && data.room_id
      ? data.room_id : "";

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

  const send = useCallback((msg: object) => {
    sendJsonMessage(msg);
  }, [sendJsonMessage]);

  return (
    <ChatContext.Provider value={{
      connectionState: readyStateToStr(readyState),
      isConnected:     readyState === ReadyState.OPEN,
      messages,
      typingUsers,
      sendJsonMessage: send,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
