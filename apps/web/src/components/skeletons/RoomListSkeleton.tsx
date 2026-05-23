import { Skeleton } from "@/components/ui/skeleton";

export function RoomListSkeleton() {
  return (
    <div style={{ padding: "12px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
      {/* Search bar skeleton */}
      <div style={{ padding: "4px", marginBottom: "4px" }}>
        <Skeleton style={{ height: "34px", borderRadius: "8px", width: "100%" }} />
      </div>

      {/* 5 room card skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "10px",
            padding:      "10px 12px",
            borderRadius: "10px",
          }}
        >
          {/* Icon skeleton */}
          <Skeleton style={{
            width:        "36px",
            height:       "36px",
            borderRadius: "10px",
            flexShrink:   0,
          }} />

          {/* Text skeletons */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Room name row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton style={{
                height:       "13px",
                width:        `${60 + (i % 3) * 20}px`,
                borderRadius: "4px",
              }} />
              <Skeleton style={{
                height:       "18px",
                width:        "32px",
                borderRadius: "999px",
              }} />
            </div>
            {/* Last message preview */}
            <Skeleton style={{
              height:       "11px",
              width:        `${80 + (i % 4) * 25}px`,
              borderRadius: "4px",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}











// import { Skeleton } from "@/components/ui/skeleton";

// export function RoomListSkeleton() {
//   return (
//     <div style={{ padding: "12px 8px", display: "flex", flexDirection: "column", gap: "6px" }}>
//       {/* Search bar skeleton */}
//       <div style={{ padding: "0 4px 8px" }}>
//         <Skeleton style={{ height: "34px", borderRadius: "8px", width: "100%" }} />
//       </div>

//       {/* 5 room card skeletons */}
//       {Array.from({ length: 5 }).map((_, i) => (
//         <div
//           key={i}
//           style={{
//             display:      "flex",
//             alignItems:   "center",
//             gap:          "10px",
//             padding:      "10px 12px",
//             borderRadius: "10px",
//             background:   "hsl(var(--accent))",
//           }}
//         >
//           {/* Icon skeleton */}
//           <Skeleton style={{ width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0 }} />

//           {/* Text skeletons */}
//           <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <Skeleton style={{ height: "13px", width: `${80 + (i % 3) * 30}px`, borderRadius: "4px" }} />
//               <Skeleton style={{ height: "18px", width: "32px", borderRadius: "999px" }} />
//             </div>
//             <Skeleton style={{ height: "11px", width: `${120 + (i % 2) * 40}px`, borderRadius: "4px" }} />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }