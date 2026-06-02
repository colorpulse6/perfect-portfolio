import React from "react"
import { NB_MONO } from "../../atlasShared"
import { Mist } from "../../AtlasFog"
import { WSPEC, FICTION_ACCENT } from "../styles"

// ── Fiction overlay chrome (veil + drifting fog + breadcrumb) ─────────
export function FictionOverlay({
  crumbTail,
  accent = FICTION_ACCENT,
  onClose,
  children,
}: {
  crumbTail?: string
  accent?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 100% at 50% 50%, rgba(3,4,10,0.6), rgba(2,3,8,0.9))",
          backdropFilter: "blur(18px) saturate(1.1)",
          WebkitBackdropFilter: "blur(18px) saturate(1.1)",
          cursor: "default",
        }}
      />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Mist presence hue={accent} solid={false} />
      </div>
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
        <span style={{ color: "rgba(180,210,230,0.4)" }}>ATLAS</span>
        <span style={{ color: "rgba(120,150,170,0.3)" }}>/</span>
        <span style={{ color: "rgba(180,210,230,0.4)" }}>WRITING</span>
        <span style={{ color: "rgba(120,150,170,0.3)" }}>/</span>
        <span style={{ color: crumbTail ? "rgba(180,210,230,0.4)" : WSPEC.pale }}>FICTION</span>
        {crumbTail && (
          <React.Fragment>
            <span style={{ color: "rgba(120,150,170,0.3)" }}>/</span>
            <span style={{ color: WSPEC.pale }}>{crumbTail}</span>
          </React.Fragment>
        )}
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
      {children}
    </div>
  )
}
