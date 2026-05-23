import type { ApiProblem } from "@chatapp/shared-types";

// const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE = "";

// ── Error classes ─────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status:      number,
    public readonly title:       string,
    public readonly detail:      string,
    public readonly type?:       string,
    public readonly retry_after?: number,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export class RateLimitError extends ApiError {
  constructor(retry_after: number) {
    super(429, "Too Many Requests", `Rate limit exceeded. Try again in ${retry_after} seconds.`, undefined, retry_after);
    this.name = "RateLimitError";
  }
}

export class AuthError extends ApiError {
  constructor(detail = "Authentication required") {
    super(401, "Unauthorized", detail);
    this.name = "AuthError";
  }
}

// ── Parse error response ──────────────────────────────────────
async function parseError(response: Response): Promise<ApiError> {
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") ?? "60", 10);
    return new RateLimitError(retryAfter);
  }
  try {
    const body = await response.json() as ApiProblem;
    return new ApiError(response.status, body.title ?? response.statusText, body.detail ?? "An unexpected error occurred", body.type);
  } catch {
    return new ApiError(response.status, response.statusText, "An unexpected error occurred");
  }
}

// ── Session refresh ───────────────────────────────────────────
let isRefreshing    = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing   = true;
  refreshPromise = (async () => {
    try {
      const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const response = await fetch(`${APP_BASE}/api/auth/get-session`, { method: "GET", credentials: "include" });
      return response.ok;
    } catch { return false; }
    finally { isRefreshing = false; refreshPromise = null; }
  })();
  return refreshPromise;
}

// ── Core fetch ────────────────────────────────────────────────
interface FetchOptions {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path:   string;
  body?:  unknown;
  retry?: boolean;
}

async function apiFetch<T>(options: FetchOptions): Promise<T> {
  const { method, path, body, retry = false } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.ok) {
    if (response.status === 204) return null as T;
    return response.json() as Promise<T>;
  }

  if (response.status === 401 && !retry) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch<T>({ ...options, retry: true });
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new AuthError();
  }

  throw await parseError(response);
}

// ── Public methods ────────────────────────────────────────────
export const apiGet    = <T>(path: string)                  => apiFetch<T>({ method: "GET",    path });
export const apiPost   = <T>(path: string, body?: unknown)  => apiFetch<T>({ method: "POST",   path, body });
export const apiPatch  = <T>(path: string, body?: unknown)  => apiFetch<T>({ method: "PATCH",  path, body });
export const apiDelete = <T>(path: string)                  => apiFetch<T>({ method: "DELETE", path });