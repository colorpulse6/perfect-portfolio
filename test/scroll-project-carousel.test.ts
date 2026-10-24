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

test("planet disc stays inside the stage at desktop, tablet and phone sizes", () => {
  for (const [width, height] of [[1440, 600], [1280, 510], [1024, 520], [390, 610], [320, 500]]) {
    const p = orbitPoint(0, 0, 7, width, height)
    assert.ok(p.cx - p.radius >= 16, `${width}: left edge`)
    assert.ok(p.cx + p.radius <= width - 16, `${width}: right edge`)
  }
})

test("every moon and its name stay inside the orbit area at every turn", () => {
  for (const [width, height] of [[1440, 640], [1440, 600], [1280, 510], [1024, 520], [390, 610], [320, 500]]) {
    for (let position = 0; position < 7; position++) {
      for (let index = 0; index < 7; index++) {
        const p = orbitPoint(index, position, 7, width, height)
        const tag = width >= 820 ? 22 : 0
        const label = `${width}x${height} turn ${position} moon ${index}`
        assert.ok(p.x - p.size / 2 >= 0, `${label}: left`)
        assert.ok(p.x + p.size / 2 <= (width >= 820 ? width * 0.5 : width), `${label}: right`)
        assert.ok(p.y - p.size / 2 >= 0, `${label}: top`)
        assert.ok(p.y + p.size / 2 + tag <= p.area, `${label}: bottom ${p.y + p.size / 2 + tag} of ${p.area}`)
      }
    }
  }
})
