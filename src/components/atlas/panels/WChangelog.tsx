import React from "react"
import { NB_MONO, NB_DISP } from "../atlasShared"
import type { ChangelogItem } from "../atlasShared"
import { Wraith } from "../shells/Wraith"
import { WSPEC, WSTAT } from "./styles"

export function WChangelog({
  changelog,
  onClose,
}: {
  changelog?: ChangelogItem[]
  onClose: () => void
}) {
  const entries = changelog || []
  return (
    <Wraith crumb={["ATLAS", "CHANGELOG"]} accent={WSPEC.glow} onClose={onClose} wide>
      <div
        style={{
          fontFamily: NB_MONO,
          fontSize: 9,
          letterSpacing: 3,
          color: WSPEC.glow,
          marginBottom: 22,
          opacity: 0.8,
        }}
      >
        SHIP LOG · NEWEST FIRST
      </div>
      <div
        className="atlas-scroll"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          textAlign: "left",
          width: 460,
          maxWidth: "84%",
          maxHeight: "56vh",
          overflowY: "auto",
          paddingRight: 12,
          pointerEvents: "auto",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)",
          maskImage:
            "linear-gradient(180deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)",
        }}
      >
        {entries.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 99,
                background: WSTAT[e.status || ""] || "rgba(180,210,230,0.4)",
                boxShadow: `0 0 8px ${WSTAT[e.status || ""] || "transparent"}`,
                flexShrink: 0,
                transform: "translateY(-2px)",
              }}
            />
            <span
              style={{
                fontFamily: NB_MONO,
                fontSize: 10,
                color: "rgba(150,180,200,0.5)",
                width: 72,
                flexShrink: 0,
              }}
            >
              {e.date}
            </span>
            <span style={{ fontFamily: NB_DISP, fontSize: 14, color: "rgba(207,234,255,0.78)", flex: 1 }}>
              {e.t}
            </span>
            <span
              style={{
                fontFamily: NB_MONO,
                fontSize: 8,
                letterSpacing: 1,
                color: WSTAT[e.status || ""] || "rgba(150,180,200,0.4)",
                textTransform: "uppercase",
              }}
            >
              {e.type}
            </span>
          </div>
        ))}
      </div>
    </Wraith>
  )
}
