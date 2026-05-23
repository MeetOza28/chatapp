"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) return null;

  const user = session.user as {
    name?: string | null;
    email?: string | null;
    username?: string | null;
  };

  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ minHeight: "100%", padding: "24px", background: "linear-gradient(180deg, hsl(var(--background)), hsl(var(--card)))" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ border: "1px solid hsl(var(--border))", borderRadius: "24px", background: "hsl(var(--card))", padding: "24px", boxShadow: "0 24px 60px rgba(15,23,42,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <Avatar style={{ width: "72px", height: "72px" }}>
              <AvatarFallback style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", fontSize: "20px", fontWeight: 700 }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                {user.name ?? user.username ?? "Profile"}
              </div>
              <div style={{ color: "hsl(var(--muted-foreground))" }}>
                {user.email}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
            <div style={{ padding: "14px 16px", borderRadius: "16px", background: "hsl(var(--secondary))" }}>
              <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))" }}>Username</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "hsl(var(--foreground))" }}>{user.username ?? "Not set"}</div>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: "16px", background: "hsl(var(--secondary))" }}>
              <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))" }}>Email</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "hsl(var(--foreground))" }}>{user.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/rooms" style={{ textDecoration: "none" }}>
              <Button>Back to rooms</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
