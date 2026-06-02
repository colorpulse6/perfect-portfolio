import React from "react"
import { NB, NB_MONO, NB_DISP } from "../atlasShared"
import { SPEC } from "../AtlasFog"

export const WSPEC = SPEC
export const WSTAT: Record<string, string> = {
  released: SPEC.glow,
  live: SPEC.glow,
  "in-progress": "#f2ab47",
  published: SPEC.bruise,
  archive: NB.pink,
  update: "#4aba7a",
  ongoing: "rgba(180,210,230,0.4)",
}
export const FICTION_ACCENT = "#caa6f2"

export const lead: React.CSSProperties = {
  fontFamily: NB_DISP,
  fontSize: 14.5,
  lineHeight: 1.7,
  color: "rgba(207,234,255,0.64)",
  textShadow: `0 0 24px ${WSPEC.cold}55`,
}
export const linkS = (c: string): React.CSSProperties => ({
  fontFamily: NB_MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.5,
  color: c,
  textDecoration: "none",
  pointerEvents: "auto",
})
