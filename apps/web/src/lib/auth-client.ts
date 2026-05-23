import { createAuthClient } from "better-auth/react";
import { usernameClient }   from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Must match the port where Next.js is running
  // Check your terminal — it says "Local: http://localhost:3000"
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [usernameClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;