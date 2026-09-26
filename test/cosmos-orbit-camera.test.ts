import { test } from "node:test"
import assert from "node:assert/strict"
import { add, sub, mul, dot, norm, len, lookAt } from "../src/components/cosmos/engine/vec3.ts"
import type { Vec3 } from "../src/components/cosmos/engine/vec3.ts"
import {
  ORBIT_DEFAULTS,
  createOrbit,
  orbitCamera,
  stepOrbit,
  zoomAt,
  flyTo,
  resetOrbit,
  dragOrbit,
} from "../src/components/cosmos/engine/orbitCamera.ts"

const cfg = { ...ORBIT_DEFAULTS, target0: [0, 0.3, 0] as Vec3, basePos: [8.5, 4.7, 20.3] as Vec3 }
const settle = (o: ReturnType<typeof createOrbit>) => {
  for (let i = 0; i < 2000; i++) stepOrbit(o, 1 / 60, { dragging: false, autoDrift: false, now: 0 })
}

test("a fresh orbit reproduces the arrival camera", () => {
  const o = createOrbit(cfg)
  const cam = orbitCamera(o, cfg, 0)
  const ref = lookAt(cfg.basePos, cfg.target0, [0, 1, 0])
  for (const k of ["pos", "F", "R", "U"] as const) {
    cam[k].forEach((v, i) => assert.ok(Math.abs(v - ref[k][i]) < 1e-9, `${k}`))
  }
})

test("zooming keeps the point under the cursor fixed on screen", () => {
  const o = createOrbit(cfg)
  const tan: [number, number] = [0.9, 0.52]
  const ndc: [number, number] = [0.4, 0.2]
  const cam = orbitCamera(o, cfg, 0)
  const dir = norm(add(cam.F, add(mul(cam.R, ndc[0] * tan[0]), mul(cam.U, ndc[1] * tan[1]))))
  const P = add(cam.pos, mul(dir, dot(sub(o.Td, cam.pos), cam.F) / dot(dir, cam.F)))
  zoomAt(o, cfg, cam, ndc, tan, 0.5, 12, 0)
  settle(o)
  const cam2 = orbitCamera(o, cfg, 0)
  const q = sub(P, cam2.pos)
  const z = dot(q, cam2.F)
  const x = dot(q, cam2.R) / z / tan[0]
  const y = dot(q, cam2.U) / z / tan[1]
  assert.ok(Math.abs(x - ndc[0]) < 1e-3 && Math.abs(y - ndc[1]) < 1e-3, `projected to ${x},${y}`)
})

test("zoom distance clamps to the configured range", () => {
  const o = createOrbit(cfg)
  const cam = orbitCamera(o, cfg, 0)
  zoomAt(o, cfg, cam, [0, 0], [0.9, 0.52], 1e-6, 12, 0)
  assert.equal(o.Dd, cfg.zMin)
  zoomAt(o, cfg, cam, [0, 0], [0.9, 0.52], 1e6, 12, 0)
  assert.equal(o.Dd, cfg.zMax)
})

test("the camera never enters the black hole keep-out sphere", () => {
  const o = createOrbit(cfg)
  flyTo(o, [0, 0.3, 0], cfg.zMin, 12, 0)
  settle(o)
  const cam = orbitCamera(o, cfg, 0)
  assert.ok(len(cam.pos) >= cfg.keepOut - 1e-9, `camera at ${len(cam.pos)}`)
})

test("reset returns to the nearest full turn without spinning back", () => {
  const o = createOrbit(cfg)
  o.az = 7
  o.azD = 7
  resetOrbit(o, cfg, false)
  assert.ok(Math.abs(o.azD - o.az) <= Math.PI + 1e-9)
  assert.ok(Math.abs(Math.sin(o.azD)) < 1e-9 && Math.cos(o.azD) > 0)
  assert.deepEqual(o.Td, cfg.target0)
  assert.equal(o.Dd, 1)
  resetOrbit(o, cfg, true)
  assert.equal(o.az, 0)
  assert.equal(o.D, 1)
})

test("dragging steers the desired angles and leaves inertia behind", () => {
  const o = createOrbit(cfg)
  dragOrbit(o, 100, -50, 16, 0)
  assert.ok(o.azD < 0 && o.elD < 0)
  assert.ok(o.vAz < 0)
  const azBefore = o.azD
  stepOrbit(o, 1 / 60, { dragging: false, autoDrift: false, now: 0 })
  assert.ok(o.azD < azBefore, "inertia keeps turning after release")
})
