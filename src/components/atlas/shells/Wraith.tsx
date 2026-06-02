import React from "react"
import { NB_MONO } from "../atlasShared"
import { Mist } from "../AtlasFog"
import { WSPEC } from "../panels/styles"

// ── The Wraith shell: fog over the dimmed galaxy, floating chrome ─────
export interface WraithProps {
  crumb: string[]
  accent?: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}
export function Wraith({ crumb, accent = WSPEC.glow, onClose, children, wide }: WraithProps) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
      {/* veil: blur the galaxy into soft mist so labels don't conflict */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 100% at 50% 50%, rgba(3,4,10,0.55), rgba(2,3,8,0.84))",
          backdropFilter: "blur(16px) saturate(1.1)",
          WebkitBackdropFilter: "blur(16px) saturate(1.1)",
          cursor: "default",
        }}
      />
      {/* cold fog drifting over the galaxy (transparent base) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Mist presence hue={accent} solid={false} />
      </div>
      {/* floating breadcrumb */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 30,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: NB_MONO,
          fontSize: 10,
          letterSpacing: 2,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 99,
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
          }}
        />
        {crumb.map((c, i) => (
          <React.Fragment key={i}>
            <span style={{ color: i === crumb.length - 1 ? WSPEC.pale : "rgba(180,210,230,0.4)" }}>
              {c}
            </span>
            {i < crumb.length - 1 && <span style={{ color: "rgba(120,150,170,0.3)" }}>/</span>}
          </React.Fragment>
        ))}
      </div>
      <span
        onClick={onClose}
        style={{
          position: "absolute",
          top: 22,
          right: 30,
          fontFamily: NB_MONO,
          fontSize: 15,
          color: "rgba(180,210,230,0.5)",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        ✕
      </span>
      {/* content — centered, dissolves at edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: wide ? "0 10%" : "0 22%",
          pointerEvents: "none",
          WebkitMaskImage: "radial-gradient(82% 78% at 50% 50%, #000 32%, transparent 94%)",
          maskImage: "radial-gradient(82% 78% at 50% 50%, #000 32%, transparent 94%)",
        }}
      >
        {children}
      </div>
    </div>
  )
}
