import { test } from "node:test"
import assert from "node:assert/strict"
import { parseRadialGradient } from "../src/components/cosmos/cssGradient.ts"

test("reads the home title backdrop as Chrome computes it", () => {
  const g = parseRadialGradient(
    "radial-gradient(rgba(10, 15, 20, 0.97) 20%, rgba(10, 15, 20, 0.86) 55%, rgba(0, 0, 0, 0) 75%)"
  )
  assert.deepEqual(g, {
    shape: "ellipse",
    stops: [
      { offset: 0.2, color: "rgba(10, 15, 20, 0.97)" },
      { offset: 0.55, color: "rgba(10, 15, 20, 0.86)" },
      { offset: 0.75, color: "rgba(0, 0, 0, 0)" },
    ],
  })
})

test("a circle, and stops without positions spread the CSS way", () => {
  const g = parseRadialGradient("radial-gradient(circle at center, red, #00ff00, blue 80%, white)")
  assert.equal(g?.shape, "circle")
  assert.deepEqual(
    g?.stops.map((s) => [s.color, Math.round(s.offset * 100)]),
    [["red", 0], ["#00ff00", 40], ["blue", 80], ["white", 100]]
  )
})

test("a stop never sits before an earlier one", () => {
  const g = parseRadialGradient("radial-gradient(red 50%, blue 20%)")
  assert.deepEqual(g?.stops.map((s) => s.offset), [0.5, 0.5])
})

test("forms the snapshot cannot place return null instead of a wrong picture", () => {
  for (const v of [
    "none",
    "linear-gradient(red, blue)",
    "radial-gradient(at 30% 40%, red, blue)",
    "radial-gradient(closest-side, red, blue)",
    "radial-gradient(100px 50px, red, blue)",
    "radial-gradient(red 10px, blue)",
    "radial-gradient(red, blue), radial-gradient(green, white)",
    "radial-gradient(red)",
  ]) {
    assert.equal(parseRadialGradient(v), null, v)
  }
})
