/**
 * Atlas camera: a smoothed orbit around a target that zoom can move
 * (zoom-to-cursor), with drag inertia, fly-to, reset, and a keep-out sphere
 * around the black hole. Pure: the stage owns the state object and calls these
 * functions each frame.
 */
import { add, sub, mul, dot, cross, norm, rot, len, lookAt } from "./vec3.ts"
import type { Vec3, CamBasis } from "./vec3.ts"

export interface OrbitConfig {
  /** Orbit target at arrival. */
  target0: Vec3
  /** Camera position at arrival (already scaled for portrait screens). */
  basePos: Vec3
  /** Zoom limits as multiples of the arrival distance. */
  zMin: number
  zMax: number
  /** The camera never comes closer than this to the world origin (black hole). */
  keepOut: number
  /** The orbit target is kept inside this radius. */
  targetRadius: number
}

export interface OrbitState {
  T: Vec3
  Td: Vec3
  D: number
  Dd: number
  az: number
  azD: number
  el: number
  elD: number
  vAz: number
  vEl: number
  /** Smoothing rate (1/s) toward the desired values. */
  rate: number
  /** performance.now() of the last user input, for idle auto-drift. */
  lastInput: number
}

export const ORBIT_DEFAULTS = { zMin: 0.12, zMax: 2.6, keepOut: 0.5 * 9.5, targetRadius: 11 }

const UP: Vec3 = [0, 1, 0]
const EL_LIMIT = 1.1
const AUTO_DRIFT = 0.012

export const clampEl = (e: number): number => Math.max(-EL_LIMIT, Math.min(EL_LIMIT, e))
export const wrapPi = (x: number): number => {
  const t = (x + Math.PI) % (2 * Math.PI)
  return (t < 0 ? t + 2 * Math.PI : t) - Math.PI
}

export function createOrbit(cfg: OrbitConfig): OrbitState {
  return {
    T: [...cfg.target0] as Vec3,
    Td: [...cfg.target0] as Vec3,
    D: 1,
    Dd: 1,
    az: 0,
    azD: 0,
    el: 0,
    elD: 0,
    vAz: 0,
    vEl: 0,
    rate: 12,
    lastInput: -1e9,
  }
}

/** Camera for the current orbit. `back` adds the arrival dolly distance. */
export function orbitCamera(o: OrbitState, cfg: OrbitConfig, back: number): CamBasis {
  const base = sub(cfg.basePos, cfg.target0)
  const baseLen = len(base)
  let dir = rot(norm(base), UP, o.az)
  const side = norm(cross(UP, dir))
  dir = norm(rot(dir, side, o.el))
  let pos = add(o.T, mul(dir, o.D * baseLen + back))
  const r = len(pos)
  if (r < cfg.keepOut) pos = mul(pos, cfg.keepOut / r)
  return lookAt(pos, o.T, UP)
}

/** Advance smoothing and inertia by dt seconds. */
export function stepOrbit(
  o: OrbitState,
  dt: number,
  opts: { dragging: boolean; autoDrift: boolean; now: number; driftScale?: number }
): void {
  if (!opts.dragging) {
    o.azD += o.vAz * dt
    o.elD = clampEl(o.elD + o.vEl * dt)
    const damp = Math.exp(-dt * 2.6)
    o.vAz *= damp
    o.vEl *= damp
    if (opts.autoDrift && opts.now - o.lastInput > 4000) o.azD += dt * AUTO_DRIFT * (opts.driftScale ?? 1)
  }
  const k = 1 - Math.exp(-dt * o.rate)
  o.az += (o.azD - o.az) * k
  o.el += (o.elD - o.el) * k
  o.D += (o.Dd - o.D) * k
  o.T = add(o.T, mul(sub(o.Td, o.T), k))
}

/** Pointer drag in CSS pixels; dtMs is the time since the previous move. */
export function dragOrbit(o: OrbitState, dx: number, dy: number, dtMs: number, now: number): void {
  const dts = Math.max(8, dtMs) / 1000
  o.azD -= dx * 0.004
  o.elD = clampEl(o.elD + dy * 0.003)
  o.vAz = o.vAz * 0.4 + ((-dx * 0.004) / dts) * 0.6
  o.vEl = o.vEl * 0.4 + ((dy * 0.003) / dts) * 0.6
  o.rate = 18
  o.lastInput = now
}

/** Releasing after holding still cancels inertia. */
export function releaseDrag(o: OrbitState, heldStillMs: number): void {
  if (heldStillMs > 90) {
    o.vAz = 0
    o.vEl = 0
  }
}

/**
 * Zoom by factor k toward the point under `ndc` on the plane through the
 * target. Zooming out past the arrival distance eases the target home.
 */
export function zoomAt(
  o: OrbitState,
  cfg: OrbitConfig,
  cam: CamBasis,
  ndc: [number, number],
  tan: [number, number],
  k: number,
  rate: number,
  now: number
): void {
  const dir = norm(add(cam.F, add(mul(cam.R, ndc[0] * tan[0]), mul(cam.U, ndc[1] * tan[1]))))
  const newD = Math.min(cfg.zMax, Math.max(cfg.zMin, o.Dd * k))
  const denom = dot(dir, cam.F)
  if (denom > 1e-3) {
    const P = add(cam.pos, mul(dir, dot(sub(o.Td, cam.pos), cam.F) / denom))
    o.Td = add(o.Td, mul(sub(P, o.Td), 1 - newD / o.Dd))
  }
  if (newD > 1) o.Td = add(o.Td, mul(sub(cfg.target0, o.Td), Math.min(1, (newD - 1) * 0.3)))
  const tl = len(o.Td)
  if (tl > cfg.targetRadius) o.Td = mul(o.Td, cfg.targetRadius / tl)
  o.Dd = newD
  o.rate = rate
  o.lastInput = now
}

/** Fly the orbit to a new target at a distance multiple. */
export function flyTo(o: OrbitState, target: Vec3, dist: number, rate: number, now: number): void {
  o.Td = [...target] as Vec3
  o.Dd = dist
  o.rate = rate
  o.lastInput = now
}

/** Return to the arrival view; `hard` snaps instead of animating. */
export function resetOrbit(o: OrbitState, cfg: OrbitConfig, hard: boolean): void {
  o.Td = [...cfg.target0] as Vec3
  o.Dd = 1
  o.azD = o.az - wrapPi(o.az)
  o.elD = 0
  o.vAz = 0
  o.vEl = 0
  o.rate = 3.5
  if (hard) {
    o.T = [...cfg.target0] as Vec3
    o.D = 1
    o.az = 0
    o.azD = 0
    o.el = 0
    o.lastInput = -1e9
  }
}
