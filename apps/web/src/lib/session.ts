import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

// cache() = runs once per request, result shared across all
// server components that call it in the same render
export const getServerSession = cache(async () => {
  // This hits the DB — confirms token exists, is not expired,
  // and belongs to a real user. Wrap in try/catch so transient DB
  // connection errors don't bubble up as 500 to the user during dev.
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    // Log the error for debugging and return null so callers
    // treat as unauthenticated instead of crashing the render.
    // In production you may want to re-throw or surface a nicer page.
    console.error("getServerSession: error fetching session", err);
    return null;
  }
});

// Use in any server component / page that shows user data
// Forged or expired cookie → session is null → redirect to login
export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  return session;   // guaranteed valid, DB-confirmed
}