import { z } from "zod";

// ── Message schema ─────────────────────────────────────────────
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters")
    .transform((val) => val.trim()),
});

export type MessageInput = z.infer<typeof messageSchema>;

// ── Create room schema ─────────────────────────────────────────
export const createRoomSchema = z.object({
  name: z
    .string()
    .min(2, "Room name must be at least 2 characters")
    .max(50, "Room name cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_\- ]+$/,
      "Room name can only contain letters, numbers, spaces, hyphens and underscores"
    )
    .transform((val) => val.trim()),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;