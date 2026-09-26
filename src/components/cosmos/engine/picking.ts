/**
 * Screen-space picking for the WebGL Atlas. Pure: the stage projects the core,
 * galaxies, project stars and the fiction knot to pixels each frame and asks
 * which one sits under the pointer.
 *
 * Project stars and the fiction knot win over the galaxy they sit in. Between
 * the core and galaxies, the target whose radius the pointer is deepest inside
 * (smallest distance / radius) wins. Touch gets a generous minimum radius.
 */
export type PickKind = "core" | "domain" | "work" | "fiction"

export interface PickTarget {
  kind: PickKind
  id: string
  x: number
  y: number
  r: number
}

const MIN_R_MOUSE = 14
const MIN_R_TOUCH = 22

export function pick(targets: PickTarget[], x: number, y: number, touch: boolean): PickTarget | null {
  const minR = touch ? MIN_R_TOUCH : MIN_R_MOUSE
  let best: PickTarget | null = null
  let bestTier = -1
  let bestScore = Infinity
  for (const t of targets) {
    const r = Math.max(t.r, minR)
    const d = Math.hypot(t.x - x, t.y - y)
    if (d > r) continue
    const tier = t.kind === "work" || t.kind === "fiction" ? 1 : 0
    const score = d / r
    if (tier > bestTier || (tier === bestTier && score < bestScore)) {
      best = t
      bestTier = tier
      bestScore = score
    }
  }
  return best
}
