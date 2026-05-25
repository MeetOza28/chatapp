"use client";

import useWebSocket, { ReadyState } from "react-use-websocket";

export type ConnectionState =
  | "idle" | "connecting" | "open" | "closed" | "failed";

// SINGLE URL builder — same function = same URL = share:true works
export function buildWsUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8001";
  return `${base}/api/v1/ws?token=${encodeURIComponent(token)}`;
}

export function readyStateToStr(rs: ReadyState): ConnectionState {
  return ({
    [ReadyState.UNINSTANTIATED]: "idle",
    [ReadyState.CONNECTING]:     "connecting",
    [ReadyState.OPEN]:           "open",
    [ReadyState.CLOSING]:        "closed",
    [ReadyState.CLOSED]:         "closed",
  } as Record<number, ConnectionState>)[rs] ?? "idle";
}