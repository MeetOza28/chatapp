import { betterAuth }     from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username }       from "better-auth/plugins";
import { drizzle, Pool }  from "@chatapp/db";
import * as schema        from "@chatapp/db/drizzle/schema";  // ← fixed path

import path from "path";
import fs   from "fs";
import { config as dotenvConfig } from "dotenv";

const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), "../../.env"),
];

const envPath = candidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });
if (envPath) dotenvConfig({ path: envPath, override: false });
else         dotenvConfig({ override: false });

const dbUrl      = process.env.DRIZZLE_DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;
const authUrl    = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

if (!dbUrl)      throw new Error("DRIZZLE_DATABASE_URL is not set in .env");
if (!authSecret) throw new Error("BETTER_AUTH_SECRET is not set in .env");

const pool = new Pool({ connectionString: dbUrl });
const db   = drizzle(pool, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user:         schema.user,
      session:      schema.session,
      account:      schema.account,
      verification: schema.verification,
    },
  }),

  baseURL: authUrl,
  secret:  authSecret,

  emailAndPassword: {
    enabled:           true,
    minPasswordLength: 8,
    autoSignIn:        true,
  },

  plugins: [
    username({
      minUsernameLength: 2,
      maxUsernameLength: 50,
      usernameValidator: (val) => /^[a-zA-Z0-9_]+$/.test(val),
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  advanced: {
    cookiePrefix: "chatapp",
    defaultCookieAttributes: {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    },
  },
});

export type Auth = typeof auth;