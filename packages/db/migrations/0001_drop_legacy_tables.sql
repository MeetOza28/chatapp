-- Remove pre-better-auth tables (uuid-based FastAPI schema)
DROP TABLE IF EXISTS "messages" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "room_members" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "rooms" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "users" CASCADE;
