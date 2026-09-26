import { test } from "node:test"
import assert from "node:assert/strict"
import { placeLabel, placeCoreLabel, LABEL_SAFE } from "../src/components/cosmos/engine/labels.ts"
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
