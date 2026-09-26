import { test } from "node:test"
import assert from "node:assert/strict"
import { findSpot, entryPoint, intersects } from "../src/components/nebula/placement.ts"
import type { Rect } from "../src/components/nebula/placement.ts"

const viewport = { w: 1440, h: 900 }

/** Deterministic pseudo-random numbers in [0, 1). */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// The home page at 1440 x 900: header band, hero block, terminal.
const blocked: Rect[] = [
  { l: 0, t: 0, r: 1440, b: 121 },
  { l: 110, t: 170, r: 1075, b: 430 },
  { l: 144, t: 782, r: 1296, b: 884 },
]

test("a spot keeps the whole card on screen and clear of the page's content", () => {
  const rand = seeded(7)
  for (let i = 0; i < 200; i++) {
    const spot = findSpot(280, 326, viewport, blocked, rand, { margin: 16, gap: 16 })
    assert.ok(spot, "a 280 x 326 card fits beside the hero at 1440 x 900")
    const box = { l: spot.x, t: spot.y, r: spot.x + 280, b: spot.y + 326 }
    assert.ok(box.l >= 16 && box.t >= 16 && box.r <= viewport.w - 16 && box.b <= viewport.h - 16)
    const padded = { l: box.l - 16, t: box.t - 16, r: box.r + 16, b: box.b + 16 }
    assert.ok(!blocked.some((r) => intersects(padded, r)), `spot ${JSON.stringify(spot)} touches the page content`)
  }
})

test("spots vary instead of always landing in the same place", () => {
  const rand = seeded(11)
  const xs = new Set<number>()
  for (let i = 0; i < 20; i++) xs.add(Math.round(findSpot(52, 52, viewport, blocked, rand, { margin: 16, gap: 16 })!.x / 40))
  assert.ok(xs.size > 5)
})

test("no spot when nothing fits", () => {
  const phone = { w: 390, h: 844 }
  const hero: Rect[] = [
    { l: 0, t: 0, r: 390, b: 100 },
    { l: 10, t: 130, r: 380, b: 560 },
    { l: 10, t: 700, r: 380, b: 830 },
  ]
  assert.equal(findSpot(280, 326, phone, hero, seeded(3), { margin: 16, gap: 16 }), null)
  assert.equal(findSpot(500, 100, phone, [], seeded(3), { margin: 16, gap: 16 }), null, "wider than the screen")
})

test("items enter from the edge nearest their spot", () => {
  const right = entryPoint({ x: 1150, y: 300 }, 280, 326, viewport)
  assert.ok(right.x > viewport.w)
  const bottom = entryPoint({ x: 600, y: 520 }, 52, 52, viewport)
  assert.ok(bottom.y > viewport.h || bottom.x > viewport.w || bottom.x < 0 || bottom.y < 0)
})
