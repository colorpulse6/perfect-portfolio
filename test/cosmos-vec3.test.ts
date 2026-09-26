import { test } from "node:test"
import assert from "node:assert/strict"
import { add, sub, mul, dot, cross, norm, rot, slerp, len, lookAt, viewProj } from "../src/components/cosmos/engine/vec3.ts"

const close = (a: number[], b: number[], eps = 1e-9) =>
  a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < eps, `${a} vs ${b}`))

test("basic vector arithmetic", () => {
  close(add([1, 2, 3], [4, 5, 6]), [5, 7, 9])
  close(sub([4, 5, 6], [1, 2, 3]), [3, 3, 3])
  close(mul([1, -2, 3], 2), [2, -4, 6])
  assert.equal(dot([1, 2, 3], [4, 5, 6]), 32)
  close(cross([1, 0, 0], [0, 1, 0]), [0, 0, 1])
  close(norm([3, 0, 4]), [0.6, 0, 0.8])
  assert.equal(len([3, 0, 4]), 5)
})

test("rotation about an axis follows the right-hand rule", () => {
  close(rot([1, 0, 0], [0, 0, 1], Math.PI / 2), [0, 1, 0], 1e-12)
})

test("slerp stays on the unit sphere", () => {
  const s = slerp([1, 0, 0], [0, 1, 0], 0.5)
  assert.ok(Math.abs(len(s) - 1) < 1e-12)
  close(s, [Math.SQRT1_2, Math.SQRT1_2, 0], 1e-12)
  close(slerp([0, 0, 1], [0, 0, 1], 0.3), [0, 0, 1])
})

test("lookAt builds a right-handed camera basis", () => {
  const cam = lookAt([0, 0, 10], [0, 0, 0], [0, 1, 0])
  close(cam.F, [0, 0, -1])
  close(cam.R, [1, 0, 0])
  close(cam.U, [0, 1, 0])
  close(cross(cam.F, cam.U), cam.R)
})

test("viewProj maps the look-at target to the view center at its distance", () => {
  const cam = lookAt([3, 4, 12], [0, 0, 0], [0, 1, 0])
  const m = viewProj(cam, 1, 0.75)
  const p = [0, 0, 0, 1]
  const clip = [0, 1, 2, 3].map((r) => m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r] * p[3])
  assert.ok(Math.abs(clip[0]) < 1e-5 && Math.abs(clip[1]) < 1e-5)
  assert.ok(Math.abs(clip[3] - 13) < 1e-5)
})
