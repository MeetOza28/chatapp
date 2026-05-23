"use client";

import { useState } from "react";
import Link              from "next/link";
import { useRouter }     from "next/navigation";
import { MessageSquare, LogOut, User, Sun, Moon } from "lucide-react";
import { useTheme }      from "next-themes";
import { toast }         from "sonner";
import Swal              from "sweetalert2";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button }        from "@/components/ui/button";
import { authClient }    from "@/lib/auth-client";

interface NavbarProps {
  user: {
    id:        string;
    name:      string;
    email:     string;
    username?: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  const router   = useRouter();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    setProfileOpen(false);

    const result = await Swal.fire({
      title:              "Sign out?",
      text:               "You will be redirected to the login page.",
      icon:               "question",
      showCancelButton:   true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor:  "#6b7280",
      confirmButtonText:  "Yes, sign out",
      cancelButtonText:   "Stay",
      showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
    });

    if (!result.isConfirmed) return;
    await authClient.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <header style={{
      height:        "56px",
      display:       "flex",
      alignItems:    "center",
      justifyContent:"space-between",
      padding:       "0 20px",
      borderBottom:  "1px solid hsl(var(--border))",
      background:    "hsl(var(--card))",
      flexShrink:    0,
      zIndex:        10,
    }}>
      {/* Logo */}
      <Link href="/rooms" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
        <div style={{
          width:         "32px",
          height:        "32px",
          borderRadius:  "8px",
          background:    "linear-gradient(135deg, #667eea, #764ba2)",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
        }}>
          <MessageSquare style={{ width: "16px", height: "16px", color: "#fff" }} />
        </div>
        <span style={{ fontWeight: "700", fontSize: "16px", color: "hsl(var(--foreground))" }}>
          ChatApp
        </span>
      </Link>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            width:        "34px",
            height:       "34px",
            padding:      0,
            borderRadius: "8px",
          }}
          aria-label="Toggle theme"
        >
          {theme === "dark"
            ? <Sun  className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </Button>

        {/* User dropdown */}
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <button
            onClick={() => setProfileOpen(true)}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "8px",
              padding:      "4px 8px",
              borderRadius: "8px",
              border:       "none",
              background:   "transparent",
              cursor:       "pointer",
              color:        "hsl(var(--foreground))",
            }}
            className="hover:bg-accent transition-colors"
          >
            <Avatar style={{ width: "32px", height: "32px" }}>
              <AvatarFallback style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                color:      "#fff",
                fontSize:   "12px",
                fontWeight: "600",
              }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span style={{ fontSize: "13px", fontWeight: "500" }}>
              {user.username ?? user.name}
            </span>
          </button>

          <DialogContent
            className="max-w-[min(92vw,28rem)] rounded-2xl border border-slate-200/80 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.35)]"
            style={{ background: "rgba(255,255,255,0.98)", color: "rgb(15 23 42)" }}
          >
            <DialogHeader>
              <DialogTitle style={{ display: "flex", alignItems: "center", gap: "12px", color: "rgb(15 23 42)" }}>
                <Avatar style={{ width: "40px", height: "40px" }}>
                  <AvatarFallback style={{
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                    color:      "#fff",
                    fontSize:   "14px",
                    fontWeight: "600",
                  }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "15px", fontWeight: "600" }}>{user.name}</div>
                  <div style={{ fontSize: "12px", color: "rgb(107 114 128)", fontWeight: "400" }}>
                    {user.email}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription style={{ display: "none" }} />
            </DialogHeader>

            {/* Profile Menu Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={(event) => {
                  event.currentTarget.blur();
                  setProfileOpen(false);
                  router.push("/profile");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgb(226 232 240)",
                  background: "transparent",
                  cursor: "pointer",
                  color: "rgb(15 23 42)",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
                className="hover:bg-slate-100"
              >
                <User style={{ width: "16px", height: "16px" }} />
                Profile
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.currentTarget.blur();
                  void handleLogout();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgb(226 232 240)",
                  background: "transparent",
                  cursor: "pointer",
                  color: "hsl(var(--destructive))",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
                className="hover:bg-red-50"
              >
                <LogOut style={{ width: "16px", height: "16px" }} />
                Sign out
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}