"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <div style={{
      minHeight:      "100vh",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "24px",
      background:     "hsl(var(--background))",
    }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>

        {/* Icon */}
        <div style={{
          width:          "64px",
          height:         "64px",
          borderRadius:   "16px",
          background:     "hsl(var(--destructive) / 0.1)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          margin:         "0 auto 24px",
        }}>
          <AlertTriangle style={{ width: "28px", height: "28px", color: "hsl(var(--destructive))" }} />
        </div>

        <h1 style={{
          fontSize:     "22px",
          fontWeight:   "700",
          color:        "hsl(var(--foreground))",
          marginBottom: "8px",
        }}>
          Something went wrong
        </h1>

        <p style={{
          fontSize:     "14px",
          color:        "hsl(var(--muted-foreground))",
          marginBottom: "24px",
          lineHeight:   "1.6",
        }}>
          An unexpected error occurred. This has been logged and we&apos;ll look into it.
        </p>

        <Alert variant="destructive" style={{ textAlign: "left", marginBottom: "20px" }}>
          <AlertTitle>Error details</AlertTitle>
          <AlertDescription style={{ fontFamily: "monospace", fontSize: "12px", wordBreak: "break-all" }}>
            {error.message || "Unknown error"}
            {error.digest && (
              <span style={{ display: "block", marginTop: "4px", opacity: 0.7 }}>
                ID: {error.digest}
              </span>
            )}
          </AlertDescription>
        </Alert>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Button
            onClick={reset}
            style={{
              background:   "linear-gradient(135deg, #667eea, #764ba2)",
              border:       "none",
              color:        "#fff",
              borderRadius: "10px",
              display:      "flex",
              alignItems:   "center",
              gap:          "6px",
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/rooms"}
            style={{ borderRadius: "10px" }}
          >
            Go to rooms
          </Button>
        </div>
      </div>
    </div>
  );
}