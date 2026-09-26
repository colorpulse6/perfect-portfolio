import { test } from "node:test"
import assert from "node:assert/strict"
import { WH, rOf, drOf, lFromR, lutMapFor, chiFromU, uFromChi, OPEN_CHI, LUT_W } from "../src/components/cosmos/engine/wormholeMath.ts"

test("wormhole constants match the approved prototype", () => {
  assert.deepEqual(WH, { a: 1.6, M: 0.34 })
  assert.ok(Math.abs(OPEN_CHI - (7.5 * Math.PI) / 180) < 1e-12)
  assert.equal(LUT_W, 4096)
})

test("the throat has radius 1 across the cylinder and grows monotonically outside", () => {
  assert.equal(rOf(0), 1)
  assert.equal(rOf(WH.a), 1)
  assert.equal(rOf(-WH.a), 1)
  let prev = rOf(WH.a)
  for (let i = 1; i <= 200; i++) {
    const l = WH.a + i * 0.5
    const r = rOf(l)
    assert.ok(r > prev, `r must increase at l=${l}`)
    assert.equal(rOf(-l), r, "r is symmetric in l")
    prev = r
  }
})

test("drOf is the derivative of rOf", () => {
  for (const l of [-9, -3, -1.7, 0, 1, 1.7, 2.5, 8, 40]) {
    const h = 1e-5
    const numeric = (rOf(l + h) - rOf(l - h)) / (2 * h)
    assert.ok(Math.abs(numeric - drOf(l)) < 1e-4, `l=${l}: ${numeric} vs ${drOf(l)}`)
  }
})

test("lFromR inverts rOf outside the throat", () => {
  for (let l = WH.a + 0.01; l < 200; l *= 1.37) {
    assert.ok(Math.abs(lFromR(rOf(l)) - l) < 1e-6, `l=${l}`)
  }
  assert.equal(lFromR(1), 0)
  assert.equal(lFromR(0.5), 0)
})

test("the LUT map concentrates samples around the sphere edge", () => {
  for (const L of [0, 1, 5, 50, 500]) {
    const [chiS, c1, c2] = lutMapFor(L)
    assert.ok(Math.abs(chiS - Math.asin(Math.min(1, 1 / rOf(L)))) < 1e-12)
    assert.ok(Math.abs(c1 - 0.9 * chiS) < 1e-12)
    assert.ok(c2 > chiS && c2 <= Math.PI * 0.98)
  }
})

test("chiFromU and uFromChi are inverses", () => {
  for (const L of [0, 1, 5, 50]) {
    const map = lutMapFor(L)
    for (let i = 0; i <= 200; i++) {
      const u = i / 200
      const back = uFromChi(chiFromU(u, map), map)
      assert.ok(Math.abs(back - u) < 1e-6, `L=${L} u=${u} -> ${back}`)
    }
  }
})
