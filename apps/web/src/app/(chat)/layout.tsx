"use client";

import { useEffect }              from "react";
import { useRouter }              from "next/navigation";
import { Navbar }                 from "@/components/layout/Navbar";
import { useSession }             from "@/lib/auth-client";
import useWebSocket               from "react-use-websocket";
import { buildWsUrl }             from "@/hooks/useWebSocket";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  for (const cookie of document.cookie.split(";")) {
    const [name, value] = cookie.trim().split("=");
    if (name === "chatapp.session_token") {
      const decoded = decodeURIComponent(value ?? "");
      return decoded.includes(".") ? decoded.split(".")[0]! : decoded;
    }
  }
  return null;
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const token = session?.session?.token ?? getTokenFromCookie();
  const wsUrl = token ? buildWsUrl(token) : null;

  // ── THE SOCKET LIVES HERE — never unmounts ─────────────
  useWebSocket(wsUrl, {
    share: true,
    shouldReconnect: (e) => {
      if (e.code === 4001) { window.location.href = "/login"; return false; }
      if (e.code === 1000) return false;
      return true;
    },
    reconnectAttempts: 10,
    reconnectInterval: (n) => Math.min(1000 * Math.pow(2, n), 30000),
    onOpen:  () => console.log("[WS] Connected ✓"),
    onClose: (e) => console.log(`[WS] Closed code=${e.code}`),
    onError: () => console.error("[WS] Error"),
  }, !!token);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  if (isPending && !token) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: "6px" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#667eea", animation: `b 1.2s ease-in-out ${i*0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes b{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );

  if (!session && !token) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <Navbar user={(session?.user ?? {}) as any} />
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}