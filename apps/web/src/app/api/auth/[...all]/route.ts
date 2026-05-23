import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Single route that handles ALL better-auth endpoints:
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//   POST /api/auth/username/check   (from username plugin)
//   ... and more
export const { GET, POST } = toNextJsHandler(auth);