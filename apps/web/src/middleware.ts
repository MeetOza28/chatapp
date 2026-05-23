import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that require a logged-in user
const PROTECTED_PATHS = ["/rooms"];

// Routes that logged-in users should not see
const AUTH_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals, static files, and auth API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Fast cookie check — no DB call, works on Edge runtime
  // This is UX only — real security check happens in:
  //   Next.js server components: requireSession() in lib/session.ts
  //   FastAPI endpoints: get_current_user_from_session() in auth_verify.py
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "chatapp",
  });

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage  = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Not logged in → redirect to login
  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → redirect away from login/register
  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/rooms", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};