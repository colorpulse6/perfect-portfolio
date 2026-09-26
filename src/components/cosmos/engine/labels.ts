/**
 * Label placement for the WebGL Atlas. Pure math: the stage projects anchors
 * and writes the resulting transforms to DOM nodes.
 *
 * A galaxy label sits outward from the black hole, past the galaxy's projected
 * disk, joined to it by a thin leader line, and is clamped inside the safe
 * area so it never runs off screen. When that spot is taken (by the HUD or by
 * another label), `layoutLabels` swings the leader to the nearest free angle.
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

/** `angle` swings the leader away from straight outward, in radians. */
export function placeLabel(i: LabelInput, angle = 0): LabelPlacement {
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
  if (angle !== 0) {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const rx = dx * c - dy * s
    dy = dx * s + dy * c
    dx = rx
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

// ── Collision-aware layout ──────────────────────────────────────────────

export interface Rect {
  l: number
  t: number
  r: number
  b: number
}

export function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.r, b.r) - Math.max(a.l, b.l)
  const h = Math.min(a.b, b.b) - Math.max(a.t, b.t)
  return w > 0 && h > 0 ? w * h : 0
}

/** Leader angles tried for each label, as offsets from straight outward. */
export const LABEL_ANGLES = [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6, Math.PI]

export interface LayoutItem {
  key: string
  anchor: Point
  center: Point
  radiusPx: number
  labelW: number
  labelH: number
}

export interface LayoutOptions {
  viewport: { w: number; h: number }
  safe: Safe
  /** HUD rectangles labels must not cover. */
  obstacles: Rect[]
  /** Rectangles already taken, such as the core label. */
  taken?: Rect[]
  /** The angle index each key used last frame. */
  prev?: Map<string, number>
}

export interface LaidOutLabel {
  key: string
  /** Index into LABEL_ANGLES. */
  candidate: number
  placement: LabelPlacement
  rect: Rect
  /** Even the best spot covers something; draw it dimmer. */
  crowded: boolean
}

// Score weights. Covering a HUD element or another label dominates; small
// terms prefer straight outward leaders, labels that stay at the end of their
// leader, and the angle used last frame (so labels do not flicker).
const W_OVERLAP = 10
const W_LABEL_OVERLAP = 1.5
const W_ANGLE = 0.15
const W_DETACH = 0.02
const W_SWITCH = 0.25
const CROWDED = 0.35

/**
 * Places labels in the given order (most important first). Each label takes
 * the candidate angle with the lowest score; later labels avoid earlier ones.
 */
export function layoutLabels(items: LayoutItem[], o: LayoutOptions): LaidOutLabel[] {
  const placed: Rect[] = [...(o.taken ?? [])]
  const out: LaidOutLabel[] = []
  for (const it of items) {
    const area = Math.max(1, it.labelW * it.labelH)
    const prev = o.prev?.get(it.key) ?? 0
    let best: LaidOutLabel | null = null
    let bestScore = Infinity
    let bestCover = 0
    for (let ci = 0; ci < LABEL_ANGLES.length; ci++) {
      const a = LABEL_ANGLES[ci]
      const p = placeLabel({ ...it, viewport: o.viewport, safe: o.safe }, a)
      const rect = { l: p.left, t: p.top, r: p.left + it.labelW, b: p.top + it.labelH }
      let cover = 0
      for (const ob of o.obstacles) cover += overlapArea(rect, ob)
      let labelCover = 0
      for (const pl of placed) labelCover += overlapArea(rect, pl)
      const [ex, ey] = p.lineTo
      const detach = Math.hypot(ex - clamp(ex, rect.l, rect.r), ey - clamp(ey, rect.t, rect.b))
      const score =
        ((cover + labelCover * W_LABEL_OVERLAP) / area) * W_OVERLAP +
        Math.abs(a) * W_ANGLE +
        detach * W_DETACH +
        (ci === prev ? 0 : W_SWITCH)
      if (score < bestScore) {
        bestScore = score
        bestCover = (cover + labelCover) / area
        best = { key: it.key, candidate: ci, placement: p, rect, crowded: false }
      }
    }
    if (!best) continue
    best.crowded = bestCover > CROWDED
    placed.push(best.rect)
    out.push(best)
  }
  return out
}
