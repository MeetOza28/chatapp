"use client";

import { useEffect }    from "react";
import { useRouter }    from "next/navigation";
import { Navbar }       from "@/components/layout/Navbar";
import { useSession }   from "@/lib/auth-client";
import { ChatProvider } from "@/context/ChatContext";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  return (
    <ChatProvider>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {session && <Navbar user={session.user as any} />}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </ChatProvider>
  );
}