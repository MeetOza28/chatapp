import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div style={{
      minHeight:      "100vh",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      flexDirection:  "column",
      gap:            "20px",
      padding:        "24px",
      background:     "hsl(var(--background))",
      textAlign:      "center",
    }}>

      {/* Big 404 */}
      <div style={{
        fontSize:   "80px",
        fontWeight: "800",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor:  "transparent",
        lineHeight: "1",
      }}>
        404
      </div>

      {/* Icon */}
      <div style={{
        width:          "56px",
        height:         "56px",
        borderRadius:   "16px",
        background:     "linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}>
        <MessageSquare style={{ width: "24px", height: "24px", color: "hsl(var(--primary))" }} />
      </div>

      <div>
        <h1 style={{
          fontSize:     "22px",
          fontWeight:   "700",
          color:        "hsl(var(--foreground))",
          marginBottom: "8px",
        }}>
          Page not found
        </h1>
        <p style={{
          fontSize:   "14px",
          color:      "hsl(var(--muted-foreground))",
          maxWidth:   "320px",
          lineHeight: "1.6",
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <Button
          asChild
          style={{
            background:   "linear-gradient(135deg, #667eea, #764ba2)",
            border:       "none",
            color:        "#fff",
            borderRadius: "10px",
          }}
        >
          <Link href="/rooms">Go to rooms</Link>
        </Button>
        <Button variant="outline" asChild style={{ borderRadius: "10px" }}>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}