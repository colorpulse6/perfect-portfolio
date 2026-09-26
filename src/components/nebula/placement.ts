/**
 * Where a floating home card or icon may rest. Pure (no DOM), so it runs in
 * Node tests: the component measures the page and the item, and this picks a
 * spot clear of everything the visitor needs to read or click.
 */
export interface Rect {
  l: number
  t: number
  r: number
  b: number
}

export interface Spot {
  x: number
  y: number
}

export const intersects = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t

export interface SpotOptions {
  /** Minimum distance from the viewport edges. */
  margin: number
  /** Minimum distance from any blocked rectangle. */
  gap: number
  /** Grid step between candidate positions, in pixels. */
  step?: number
}

/**
 * A top-left position for a `w` x `h` item fully inside the viewport and at
 * least `gap` away from every blocked rectangle, chosen at random among the
 * free candidates so items do not always land in the same place. Candidates
 * lie on a grid (random sampling misses narrow free strips, such as the one
 * beside the home title). Returns null when nothing fits (a phone with the
 * hero filling the screen).
 */
export function findSpot(
  w: number,
  h: number,
  viewport: { w: number; h: number },
  blocked: Rect[],
  rand: () => number,
  o: SpotOptions
): Spot | null {
  const minX = o.margin
  const minY = o.margin
  const maxX = viewport.w - w - o.margin
  const maxY = viewport.h - h - o.margin
  if (maxX < minX || maxY < minY) return null
  const step = o.step ?? 16
  const free: Spot[] = []
  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      const box = { l: x - o.gap, t: y - o.gap, r: x + w + o.gap, b: y + h + o.gap }
      if (!blocked.some((r) => intersects(box, r))) free.push({ x, y })
    }
  }
  if (free.length === 0) return null
  return free[Math.floor(rand() * free.length)]
}

/**
 * Where an item starts its entrance: just outside the viewport, on the side
 * its resting spot is closest to, so it streaks in along a short path.
 */
export function entryPoint(spot: Spot, w: number, h: number, viewport: { w: number; h: number }): Spot {
  const toLeft = spot.x + w
  const toRight = viewport.w - spot.x
  const toTop = spot.y + h
  const toBottom = viewport.h - spot.y
  const nearest = Math.min(toLeft, toRight, toTop, toBottom)
  if (nearest === toLeft) return { x: -w - 40, y: spot.y + (spot.y > viewport.h / 2 ? 60 : -60) }
  if (nearest === toRight) return { x: viewport.w + 40, y: spot.y + (spot.y > viewport.h / 2 ? 60 : -60) }
  if (nearest === toTop) return { x: spot.x + (spot.x > viewport.w / 2 ? 80 : -80), y: -h - 40 }
  return { x: spot.x + (spot.x > viewport.w / 2 ? 80 : -80), y: viewport.h + 40 }
}
