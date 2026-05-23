import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Load env from multiple possible locations
const url =
  process.env.DRIZZLE_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DRIZZLE_DATABASE_URL is not set. Add it to chatapp/.env"
  );
}

// Use a connection pool — required for Next.js API routes
// which can have many concurrent requests
const pool = new Pool({
  connectionString: url,
  max: 10,
});

export const db = drizzle(pool);