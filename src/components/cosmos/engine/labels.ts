/**
 * Label placement for the WebGL Atlas. Pure math: the stage projects anchors
 * and writes the resulting transforms to DOM nodes.
 *
 * A galaxy label sits outward from the black hole, past the galaxy's projected
 * disk, joined to it by a thin leader line, and is clamped inside the safe
 * area so it never runs off screen or under the header and bottom nav.
 */
export interface Point {
  x: number
  y: number
}
export interface Safe {
  l: number
  r: number
  t: number
  b: number
}
export const LABEL_SAFE: Safe = { l: 12, r: 12, t: 56, b: 56 }

export interface LabelInput {
  anchor: Point
  center: Point
  radiusPx: number
  labelW: number
  labelH: number
  viewport: { w: number; h: number }
  safe: Safe
}

export interface LabelPlacement {
  left: number
  top: number
  lineFrom: [number, number]
  lineTo: [number, number]
  side: "left" | "right"
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function placeLabel(i: LabelInput): LabelPlacement {
  let dx = i.anchor.x - i.center.x
  let dy = i.anchor.y - i.center.y
  const dl = Math.hypot(dx, dy)
  if (dl < 1) {
    dx = 1
    dy = 0
  } else {
    dx /= dl
    dy /= dl
  }
  const r0 = Math.min(i.radiusPx * 0.5, 70)
  const r1 = Math.min(i.radiusPx * 0.95, 180) + 22
  const x0 = i.anchor.x + dx * r0
  const y0 = i.anchor.y + dy * r0
  const x1 = i.anchor.x + dx * r1
  const y1 = i.anchor.y + dy * r1
  const side = dx >= -0.15 ? "right" : "left"
  const left = clamp(side === "right" ? x1 + 6 : x1 - 6 - i.labelW, i.safe.l, i.viewport.w - i.labelW - i.safe.r)
  const top = clamp(y1 - i.labelH / 2, i.safe.t, i.viewport.h - i.labelH - i.safe.b)
  return { left, top, lineFrom: [x0, y0], lineTo: [x1, y1], side }
}

export interface CoreLabelInput {
  center: Point
  diskPx: number
  labelW: number
  labelH: number
  viewport: { w: number; h: number }
  narrow: boolean
  safe?: Safe
}

/** The black hole's own label: beside the disk, or centered under it when that would overflow. */
export function placeCoreLabel(i: CoreLabelInput): { left: number; top: number } {
  const safe = i.safe ?? LABEL_SAFE
  let left = i.narrow ? i.center.x - i.labelW / 2 : i.center.x + i.diskPx * 1.02 + 14
  let top = i.narrow ? i.center.y + i.diskPx * 0.55 + 10 : i.center.y - 10
  if (left + i.labelW > i.viewport.w - safe.r) {
    left = i.center.x - i.labelW / 2
    top = i.center.y + i.diskPx * 0.62 + 12
  }
  return {
    left: clamp(left, safe.l, i.viewport.w - i.labelW - safe.r),
    top: clamp(top, safe.t, i.viewport.h - i.labelH - safe.b),
  }
}
