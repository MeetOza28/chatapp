import { Skeleton } from "@/components/ui/skeleton";

interface BubbleSkeletonProps {
  isRight:   boolean;
  width:     number;
  showAvatar:boolean;
}

function BubbleSkeleton({ isRight, width, showAvatar }: BubbleSkeletonProps) {
  if (isRight) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "2px 0" }}>
        <div style={{ maxWidth: "320px" }}>
          <Skeleton style={{
            height:       `${32 + Math.floor(Math.random() * 16)}px`,
            width:        `${width}px`,
            borderRadius: "14px 4px 14px 14px",
          }} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
            <Skeleton style={{ height: "10px", width: "36px", borderRadius: "4px" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "2px 0" }}>
      {/* Avatar */}
      <div style={{ width: "32px", flexShrink: 0 }}>
        {showAvatar && (
          <Skeleton style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
        )}
      </div>
      {/* Bubble */}
      <div style={{ maxWidth: "320px" }}>
        {showAvatar && (
          <Skeleton style={{
            height:       "11px",
            width:        "60px",
            borderRadius: "4px",
            marginBottom: "5px",
          }} />
        )}
        <Skeleton style={{
          height:       `${32 + Math.floor(Math.random() * 16)}px`,
          width:        `${width}px`,
          borderRadius: showAvatar ? "4px 14px 14px 14px" : "14px",
        }} />
        <Skeleton style={{
          height:       "10px",
          width:        "36px",
          borderRadius: "4px",
          marginTop:    "4px",
        }} />
      </div>
    </div>
  );
}

// Deterministic widths — avoids hydration mismatch from Math.random()
const BUBBLE_CONFIG = [
  { isRight: false, width: 180, showAvatar: true  },
  { isRight: false, width: 240, showAvatar: false },
  { isRight: true,  width: 200, showAvatar: false },
  { isRight: false, width: 160, showAvatar: true  },
  { isRight: true,  width: 280, showAvatar: false },
  { isRight: true,  width: 140, showAvatar: false },
  { isRight: false, width: 220, showAvatar: true  },
  { isRight: true,  width: 190, showAvatar: false },
  { isRight: false, width: 260, showAvatar: false },
  { isRight: true,  width: 170, showAvatar: false },
];

export function ChatSkeleton() {
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      height:        "100%",
      overflow:      "hidden",
    }}>

      {/* Room header skeleton */}
      <div style={{
        padding:      "0 20px",
        height:       "52px",
        borderBottom: "1px solid hsl(var(--border))",
        display:      "flex",
        alignItems:   "center",
        justifyContent:"space-between",
        background:   "hsl(var(--card))",
        flexShrink:   0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Skeleton style={{ width: "28px", height: "28px", borderRadius: "8px" }} />
          <Skeleton style={{ width: "100px", height: "15px", borderRadius: "4px" }} />
        </div>
        <Skeleton style={{ width: "80px", height: "12px", borderRadius: "4px" }} />
      </div>

      {/* Messages skeleton */}
      <div style={{
        flex:    1,
        padding: "16px 20px",
        display: "flex",
        flexDirection:"column",
        gap:     "4px",
        overflowY:"auto",
      }}>
        {BUBBLE_CONFIG.map((cfg, i) => (
          <BubbleSkeleton key={i} {...cfg} />
        ))}
      </div>

      {/* Input skeleton */}
      <div style={{
        padding:     "12px 20px 16px",
        borderTop:   "1px solid hsl(var(--border))",
        background:  "hsl(var(--card))",
        display:     "flex",
        gap:         "8px",
        alignItems:  "flex-end",
        flexShrink:  0,
      }}>
        <Skeleton style={{ flex: 1, height: "42px", borderRadius: "12px" }} />
        <Skeleton style={{ width: "42px", height: "42px", borderRadius: "12px" }} />
      </div>
    </div>
  );
}











// import { Skeleton } from "@/components/ui/skeleton";

// export function ChatSkeleton() {
//   // Alternate left/right — 10 bubbles total
//   const bubbles = [
//     { own: false, width: 220 },
//     { own: true,  width: 180 },
//     { own: false, width: 300 },
//     { own: true,  width: 260 },
//     { own: false, width: 200 },
//     { own: true,  width: 140 },
//     { own: false, width: 280 },
//     { own: true,  width: 220 },
//     { own: false, width: 160 },
//     { own: true,  width: 300 },
//   ];

//   return (
//     <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
//       {bubbles.map((b, i) => (
//         <div
//           key={i}
//           style={{
//             display:        "flex",
//             justifyContent: b.own ? "flex-end" : "flex-start",
//             alignItems:     "flex-end",
//             gap:            "8px",
//           }}
//         >
//           {/* Avatar — only on left-side messages */}
//           {!b.own && (
//             <Skeleton style={{
//               width:        "32px",
//               height:       "32px",
//               borderRadius: "50%",
//               flexShrink:   0,
//             }} />
//           )}

//           {/* Message bubble */}
//           <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: b.own ? "flex-end" : "flex-start" }}>
//             {!b.own && i % 3 === 0 && (
//               <Skeleton style={{ height: "11px", width: "60px", borderRadius: "4px" }} />
//             )}
//             <Skeleton style={{
//               height:       "40px",
//               width:        `${b.width}px`,
//               borderRadius: b.own ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
//             }} />
//             <Skeleton style={{ height: "10px", width: "40px", borderRadius: "4px" }} />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }