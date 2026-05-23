import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from repo root (two levels up from packages/db)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const url = process.env.DRIZZLE_DATABASE_URL;
if (!url) {
  throw new Error(
    "DRIZZLE_DATABASE_URL is not set.\n" +
    "Make sure your .env has: DRIZZLE_DATABASE_URL=postgresql://chatapp:chatapp_secret@localhost:5432/chatapp_db"
  );
}

export default defineConfig({
  // schema: "./src/schema.ts",
  // out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  // verbose: true,
  // strict: true,
});