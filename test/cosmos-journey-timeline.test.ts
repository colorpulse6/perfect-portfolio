import { test } from "node:test"
import assert from "node:assert/strict"
import { J, journeyFrames, journeyParams } from "../src/components/cosmos/engine/journeyTimeline.ts"
import type { JourneyParams } from "../src/components/cosmos/engine/journeyTimeline.ts"
import { dot, lookAt } from "../src/components/cosmos/engine/vec3.ts"
import type { Vec3 } from "../src/components/cosmos/engine/vec3.ts"

const az = 0.42
const el = 0.2
const arrival = lookAt(
  [Math.sin(az) * Math.cos(el) * 24, Math.sin(el) * 24, Math.cos(az) * Math.cos(el) * 24],
  [0, 0.3, 0],
  [0, 1, 0]
)
const frames = journeyFrames({ viewport: { w: 1440, h: 900 }, ctaCenter: { x: 720, y: 640 }, arrival })

const tracked = (p: JourneyParams) => ({ l: p.l, fovK: p.fovK, back: p.back, Fx: p.F[0], Fy: p.F[1], Fz: p.F[2] })

/** Every number in two parameter sets matches within `eps`. */
function assertClose(a: unknown, b: unknown, eps: number, path = "params") {
  if (typeof a === "number" && typeof b === "number") {
    assert.ok(Math.abs(a - b) <= eps, `${path}: ${a} vs ${b}`)
  } else if (a && b && typeof a === "object" && typeof b === "object") {
    for (const k of Object.keys(a)) assertClose((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], eps, `${path}.${k}`)
  } else {
    assert.equal(a, b, path)
  }
}

test("the journey is continuous across its phase boundaries", () => {
  // A small step: l legitimately moves about 12 units per second near the
  // crossing, so only a real jump can exceed the bound.
  const h = 1e-6
  for (const tb of [J.open1, J.cross, J.switch]) {
    const a = tracked(journeyParams(tb - h, frames, 1))
    const b = tracked(journeyParams(tb + h, frames, 1))
    for (const k of Object.keys(a) as (keyof typeof a)[]) {
      assert.ok(Math.abs(a[k] - b[k]) < 1e-3, `${k} jumps at t=${tb}: ${a[k]} -> ${b[k]}`)
    }
  }
})

test("home is continuous with the first journey frame", () => {
  assertClose(tracked(journeyParams(-1e-6, frames, 1)).back, tracked(journeyParams(1e-6, frames, 1)).back, 1e-6)
  assert.equal(journeyParams(-0.5, frames, 1).home, true)
  assert.equal(journeyParams(0, frames, 1).home, false)
})

test("the lens is off before the wormhole opens", () => {
  assert.equal(journeyParams(-0.1, frames, 1).lensOn, false)
  assert.equal(journeyParams(J.open0 - 1e-3, frames, 1).lensOn, false)
  assert.equal(journeyParams(J.open0 + 1e-3, frames, 1).lensOn, true)
})

test("the page has faded out by the switch", () => {
  assert.equal(journeyParams(J.switch, frames, 1).fade, 0)
  assert.equal(journeyParams(0.5, frames, 1).fade, 1)
})

test("speed scales every time", () => {
  for (const t of [0.05, 0.5, 1.2, 2.3, 3.0, 3.4]) {
    assertClose(journeyParams(t / 1.45, frames, 1.45), journeyParams(t, frames, 1), 1e-9)
  }
})

test("at the switch the camera looks down the journey axis with no roll", () => {
  const p = journeyParams(J.switch, frames, 1)
  assert.ok(dot(p.F, frames.JF.Z) > 1 - 1e-9)
  assert.ok(Math.abs(p.roll) < 1e-9)
})

test("the journey axis points at the call to action", () => {
  const centered = journeyFrames({ viewport: { w: 1440, h: 900 }, ctaCenter: { x: 720, y: 450 }, arrival })
  const ahead: Vec3 = [0, 0, -1]
  assert.ok(dot(centered.JF.Z, ahead) > 1 - 1e-12)
  assert.ok(frames.JF.Z[1] < 0, "a CTA below the center tilts the axis down")
  assert.ok(Math.abs(dot(frames.JF.X, frames.JF.Z)) < 1e-12 && Math.abs(dot(frames.JF.Y, frames.JF.Z)) < 1e-12)
})

test("portrait viewports widen the vertical field and move the arrival back", () => {
  const phone = journeyFrames({ viewport: { w: 390, h: 844 }, ctaCenter: { x: 195, y: 600 }, arrival })
  assert.ok(phone.HOME.tanY > frames.HOME.tanY)
  assert.equal(phone.ARR_K, 1.22)
  assert.equal(frames.ARR_K, 1)
})

test("the destination camera ends at the arrival pose", () => {
  const end = journeyParams(J.end, frames, 1)
  assert.ok(Math.abs(end.back) < 1e-9)
  assertClose(end.dest.pos, arrival.pos, 1e-9)
})
