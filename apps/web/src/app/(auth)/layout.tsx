import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "ChatApp — Welcome",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      }}
    >
      {/* Animated blobs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          animation: "blob 8s infinite ease-in-out",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          animation: "blob 10s infinite ease-in-out reverse",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "40%",
          left: "60%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          animation: "blob 12s infinite ease-in-out",
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes blob {
          0%, 100% { transform: scale(1) translate(0, 0); }
          33%       { transform: scale(1.1) translate(20px, -20px); }
          66%       { transform: scale(0.95) translate(-15px, 15px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-animate {
          animation: fadeInUp 0.5s ease both;
        }
        .auth-card {
          backdrop-filter: blur(20px);
          background: rgba(255,255,255,0.95) !important;
          border: 1px solid rgba(255,255,255,0.8) !important;
          box-shadow: 0 25px 60px rgba(102,126,234,0.3), 0 8px 24px rgba(0,0,0,0.12) !important;
        }
        .dark .auth-card {
          background: rgba(15,20,40,0.92) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
      `}</style>

      {/* Logo */}
      <div className="auth-animate flex flex-col items-center gap-3 mb-6 z-10"
        style={{ animationDelay: "0s" }}
      >
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.25)",
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(255,255,255,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}>
          <MessageSquare style={{ width: "26px", height: "26px", color: "#fff" }} />
        </div>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#fff",
          letterSpacing: "-0.5px",
          textShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          ChatApp
        </h1>
        <p style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.8)",
          fontWeight: "400",
        }}>
          Real-time chat for modern teams
        </p>
      </div>

      {/* Card */}
      <div className="auth-animate auth-card z-10 w-full rounded-2xl overflow-hidden"
        style={{ maxWidth: "440px", animationDelay: "0.1s" }}
      >
        {children}
      </div>

      {/* Footer */}
      <p className="auth-animate mt-6 text-sm z-10"
        style={{ color: "rgba(255,255,255,0.65)", animationDelay: "0.2s" }}
      >
        © {new Date().getFullYear()} ChatApp. All rights reserved.
      </p>
    </div>
  );
}