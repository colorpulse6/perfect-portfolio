import { ArtifactDef } from "./artifacts"
// Type-only import: erased at compile time, so the FeaturedEntry/floatingPhysics
// reference cycle never exists at runtime.
import type { FeaturedEntry } from "./DomArtifacts"

export interface FloatingIcon {
  kind: "icon"
  artifact: ArtifactDef
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  phase: "shooting" | "materializing" | "floating" | "dissolving" | "hidden"
  phaseTime: number
  bobPhase: number
}

export interface FloatingCard {
  kind: "card"
  entry: FeaturedEntry
  id: string
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  phase: "shooting" | "materializing" | "floating" | "dissolving" | "hidden"
  phaseTime: number
  bobPhase: number
}

export type FloatingItem = FloatingIcon | FloatingCard

export const MAX_ICONS = 3
export const ICON_FLOAT_DURATION = 12
export const ICON_COOLDOWN = 10000
export const MAX_CARDS = 2
export const CARD_FLOAT_DURATION = 12
export const CARD_COOLDOWN = 5000
export const DISSOLVE_DURATION = 2
export const MATERIALIZE_DURATION = 1.5

export function spawnFromEdge(): { x: number; y: number; vx: number; vy: number } {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200
  const h = typeof window !== "undefined" ? window.innerHeight : 800
  const side = Math.floor(Math.random() * 4)
  let x: number, y: number

  switch (side) {
    case 0: x = -60; y = Math.random() * h; break
    case 1: x = w + 60; y = Math.random() * h; break
    case 2: x = Math.random() * w; y = -60; break
    default: x = Math.random() * w; y = h + 60; break
  }

  const targetX = w * 0.2 + Math.random() * w * 0.6
  const targetY = h * 0.2 + Math.random() * h * 0.6
  const angle = Math.atan2(targetY - y, targetX - x)
  const speed = 300 + Math.random() * 200

  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed }
}
