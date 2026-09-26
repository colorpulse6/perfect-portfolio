import { test } from "node:test"
import assert from "node:assert/strict"
import { placeLabel, placeCoreLabel, layoutLabels, overlapArea, LABEL_SAFE } from "../src/components/cosmos/engine/labels.ts"
import { pick } from "../src/components/cosmos/engine/picking.ts"
import type { PickTarget } from "../src/components/cosmos/engine/picking.ts"

const viewport = { w: 1440, h: 900 }

test("labels sit outward from the black hole, past the galaxy", () => {
  const p = placeLabel({ anchor: { x: 1000, y: 400 }, center: { x: 720, y: 450 }, radiusPx: 60, labelW: 90, labelH: 28, viewport, safe: LABEL_SAFE })
  assert.equal(p.side, "right")
  assert.ok(p.left > 1000 + 60 * 0.9, "clears the galaxy disk")
  assert.ok(Math.abs(Math.hypot(p.lineFrom[0] - 1000, p.lineFrom[1] - 400) - 30) < 1e-9, "line starts at half the radius")
  const q = placeLabel({ anchor: { x: 300, y: 500 }, center: { x: 720, y: 450 }, radiusPx: 60, labelW: 90, labelH: 28, viewport, safe: LABEL_SAFE })
  assert.equal(q.side, "left")
  assert.ok(q.left + 90 < 300, "left-side labels end before the anchor")
})

test("labels clamp inside the safe area", () => {
  const p = placeLabel({ anchor: { x: 1430, y: 890 }, center: { x: 720, y: 450 }, radiusPx: 200, labelW: 160, labelH: 30, viewport, safe: LABEL_SAFE })
  assert.ok(p.left >= LABEL_SAFE.l && p.left + 160 <= viewport.w - LABEL_SAFE.r)
  assert.ok(p.top >= LABEL_SAFE.t && p.top + 30 <= viewport.h - LABEL_SAFE.b)
})

test("the core label moves under the disk when it would run off screen", () => {
  const wide = placeCoreLabel({ center: { x: 720, y: 450 }, diskPx: 120, labelW: 170, labelH: 30, viewport, narrow: false })
  assert.ok(wide.left > 720 + 120)
  const closeUp = placeCoreLabel({ center: { x: 720, y: 450 }, diskPx: 700, labelW: 170, labelH: 30, viewport, narrow: false })
  assert.ok(Math.abs(closeUp.left + 85 - 720) < 1e-9, "centered under the black hole")
  assert.ok(closeUp.top > 450)
})

const item = (key: string, anchor: { x: number; y: number }) => ({
  key,
  anchor,
  center: { x: 720, y: 450 },
  radiusPx: 40,
  labelW: 120,
  labelH: 28,
})

test("an unobstructed label keeps the straight outward leader", () => {
  const [a] = layoutLabels([item("a", { x: 1000, y: 450 })], { viewport, safe: LABEL_SAFE, obstacles: [] })
  assert.equal(a.candidate, 0)
  assert.equal(a.crowded, false)
})

test("a label swings away from a HUD element", () => {
  const free = placeLabel({ ...item("a", { x: 400, y: 600 }), viewport, safe: LABEL_SAFE })
  const rail = { l: free.left - 10, t: free.top - 10, r: free.left + 130, b: free.top + 38 }
  const [a] = layoutLabels([item("a", { x: 400, y: 600 })], { viewport, safe: LABEL_SAFE, obstacles: [rail] })
  assert.notEqual(a.candidate, 0)
  assert.equal(overlapArea(a.rect, rail), 0)
  assert.equal(a.crowded, false)
})

test("labels with nearby anchors do not cover each other", () => {
  const out = layoutLabels([item("a", { x: 1000, y: 450 }), item("b", { x: 1000, y: 462 })], {
    viewport,
    safe: LABEL_SAFE,
    obstacles: [],
  })
  assert.equal(overlapArea(out[0].rect, out[1].rect), 0)
})

test("labels avoid rectangles that are already taken", () => {
  const first = placeLabel({ ...item("a", { x: 1000, y: 450 }), viewport, safe: LABEL_SAFE })
  const core = { l: first.left, t: first.top, r: first.left + 120, b: first.top + 28 }
  const [a] = layoutLabels([item("a", { x: 1000, y: 450 })], { viewport, safe: LABEL_SAFE, obstacles: [], taken: [core] })
  assert.equal(overlapArea(a.rect, core), 0)
})

test("a label keeps last frame's angle while that spot is still free", () => {
  const prev = new Map([["a", 2]])
  const [a] = layoutLabels([item("a", { x: 1000, y: 450 })], { viewport, safe: LABEL_SAFE, obstacles: [], prev })
  assert.equal(a.candidate, 2)
})

test("a label with no free spot is marked crowded", () => {
  const all = { l: 0, t: 0, r: viewport.w, b: viewport.h }
  const [a] = layoutLabels([item("a", { x: 1000, y: 450 })], { viewport, safe: LABEL_SAFE, obstacles: [all] })
  assert.equal(a.crowded, true)
})

const targets: PickTarget[] = [
  { kind: "core", id: "me", x: 720, y: 450, r: 90 },
  { kind: "domain", id: "obsidian", x: 800, y: 200, r: 50 },
  { kind: "work", id: "obsidian:a", x: 790, y: 210, r: 8 },
  { kind: "domain", id: "web", x: 1100, y: 420, r: 6 },
]

test("empty space picks nothing", () => {
  assert.equal(pick(targets, 100, 800, false), null)
})

test("project stars win over their own galaxy", () => {
  assert.equal(pick(targets, 792, 212, false)?.id, "obsidian:a")
  assert.equal(pick(targets, 830, 190, false)?.id, "obsidian")
})

test("touch gets a generous minimum radius", () => {
  assert.equal(pick(targets, 1118, 420, false), null)
  assert.equal(pick(targets, 1118, 420, true)?.id, "web")
})

test("overlapping core and galaxy resolve by normalized distance", () => {
  const overlap: PickTarget[] = [
    { kind: "core", id: "me", x: 700, y: 450, r: 100 },
    { kind: "domain", id: "ai", x: 760, y: 450, r: 40 },
  ]
  assert.equal(pick(overlap, 765, 450, false)?.id, "ai")
  assert.equal(pick(overlap, 690, 450, false)?.id, "me")
})
