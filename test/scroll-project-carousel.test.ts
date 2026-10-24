import test from "node:test"
import assert from "node:assert/strict"
import { wrapIndex, orbitPoint } from "../src/components/scroll/engine/projectCarouselMath.ts"

test("seven projects wrap in both directions", () => {
  assert.equal(wrapIndex(7, 7), 0)
  assert.equal(wrapIndex(-1, 7), 6)
  assert.equal(wrapIndex(8, 7), 1)
})

test("planet orbit puts the active moon on the near side and sizes it above others", () => {
  const front = orbitPoint(0, 0, 7, 1440, 640)
  const next = orbitPoint(1, 0, 7, 1440, 640)
  assert.ok(front.size > next.size)
  assert.ok(front.x > next.x)
  assert.ok(front.opacity > next.opacity)
})
