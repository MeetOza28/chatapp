// ═══════════════════════════════════════════════════════════════
// @chatapp/shared-types
//
// Single source of truth for all types shared across the monorepo.
// Used by:
//   - apps/web  (frontend)
//   - apps/api  (FastAPI reads these to stay in sync)
//
// Rule: if a type is used in more than one place → it lives here.
// ═══════════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────────
export interface UserPublic {
  id:        string;
  username:  string | null;
  name:      string;
  email:     string;
  createdAt: string;
  updatedAt: string;
}

// ── Room ─────────────────────────────────────────────────────
export interface Room {
  id:          string;
  name:        string;
  ownerId:     string | null;
  createdAt:   string;
  memberCount: number;
  lastMessage: MessagePreview | null;
}

export interface MessagePreview {
  content:        string;
  senderUsername: string;
  sentAt:         string;
}

export interface RoomMember {
  id:        string;
  username:  string;
  name:      string;
  joinedAt:  string;
}

// ── Message ───────────────────────────────────────────────────
export interface Message {
  id:             string;
  roomId:         string;
  senderId:       string | null;
  senderUsername: string;
  content:        string;
  messageType:    MessageType;
  sentAt:         string;
}

export type MessageType = "text" | "system" | "ai";

// ── WebSocket — Client → Server ───────────────────────────────
export interface WsOutgoingMessage {
  type:    "message";
  room_id: string;
  content: string;
}

export interface WsOutgoingTyping {
  type:      "typing";
  room_id:   string;
  is_typing: boolean;
}

export interface WsOutgoingPong {
  type: "pong";
}

export type WsOutgoing =
  | WsOutgoingMessage
  | WsOutgoingTyping
  | WsOutgoingPong;

// ── WebSocket — Server → Client ───────────────────────────────
export interface WsConnected {
  type:     "connected";
  user_id:  string;
  username: string;
}

export interface WsMessage {
  type:            "message";
  id:              string;
  room_id:         string;
  sender_id:       string | null;
  sender_username: string;
  content:         string;
  message_type:    MessageType;
  sent_at:         string;
}

export interface WsHistory {
  type:     "history";
  room_id:  string;
  messages: WsMessage[];
}

export interface WsTyping {
  type:      "typing";
  room_id:   string;
  user_id:   string;
  username:  string;
  is_typing: boolean;
}

export interface WsPresence {
  type:     "presence";
  room_id:  string;
  user_id:  string;
  username: string;
  status:   "online" | "offline";
}

export interface WsOnlineUsers {
  type:    "online_users";
  room_id: string;
  users:   { user_id: string; username: string }[];
}

export interface WsPing {
  type: "ping";
}

export interface WsError {
  type:   "error";
  code:   number;
  detail: string;
}

export type WsIncoming =
  | WsConnected
  | WsMessage
  | WsHistory
  | WsTyping
  | WsPresence
  | WsOnlineUsers
  | WsPing
  | WsError;

// ── Connection state ──────────────────────────────────────────
export type ConnectionState =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "closed"
  | "failed";

// ── API error (RFC 7807) ──────────────────────────────────────
export interface ApiProblem {
  type:       string;
  title:      string;
  status:     number;
  detail:     string;
  instance?:  string;
}

// ── API response shapes ───────────────────────────────────────
export interface MessagesResponse {
  messages: Message[];
  total:    number;
}

export interface JoinRoomResponse {
  message: string;
  room_id: string;
  user_id: string;
}