/**
 * The home-to-Atlas journey timeline. Pure: maps journey time to the camera
 * and every effect parameter, ported from the approved prototype
 * (docs/superpowers/specs/assets/2026-09-26-wormhole-study.html, `params`
 * and `computeFrames`).
 *
 * Beats, in timeline seconds (before `speed` scaling): the call to action
 * ignites (0), the wormhole opens around it (open0 to open1), the camera
 * plunges to the throat (cross), exits into the Atlas universe and hands off
 * to the Atlas orbit camera (switch). `end` is when the arrival settles.
 */
import { WH, OPEN_CHI, lFromR } from "./wormholeMath.ts"
import { add, cross, dot, mul, norm, rot, slerp, sub } from "./vec3.ts"
import type { CamBasis, Vec3 } from "./vec3.ts"

export const J = { open0: 0.1, open1: 1.15, cross: 2.3, switch: 3.2, end: 3.8 }

/** Proper distance at which the opening sphere reaches OPEN_CHI. */
export const L1 = lFromR(1 / Math.sin(OPEN_CHI))

const DEG = Math.PI / 180

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const smooth = (x: number) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}
export const bump = (t: number, c: number, w: number) => Math.exp(-(((t - c) / w) ** 2))
export const easeOutBack = (x: number, s = 1.4) => {
  const c = clamp01(x) - 1
  return 1 + (s + 1) * c * c * c + s * c * c
}

export interface JourneyFrames {
  /** The home page camera: looking down -z with the site's field of view. */
  HOME: { F: Vec3; R: Vec3; U: Vec3; tanX: number; tanY: number }
  /** The journey axis: Z points from the camera at the call to action. */
  JF: { X: Vec3; Y: Vec3; Z: Vec3 }
  /** Half-field tangent of the destination render target. */
  RT_TAN: number
  /** The Atlas arrival camera. */
  ARR: CamBasis
  /** Portrait screens start the arrival further back. */
  ARR_K: number
}

export interface JourneyInput {
  viewport: { w: number; h: number }
  /** Center of the call to action, in CSS pixels. */
  ctaCenter: { x: number; y: number }
  arrival: CamBasis
}

export function journeyFrames({ viewport, ctaCenter, arrival }: JourneyInput): JourneyFrames {
  const { w, h } = viewport
  const base = Math.tan(27.5 * DEG)
  const tanY = w >= h ? base : (base * h) / w
  const tanX = (tanY * w) / h
  const HOME = { F: [0, 0, -1] as Vec3, R: [1, 0, 0] as Vec3, U: [0, 1, 0] as Vec3, tanX, tanY }
  const nx = (2 * ctaCenter.x) / w - 1
  const ny = 1 - (2 * ctaCenter.y) / h
  const Z = norm([nx * tanX, ny * tanY, -1])
  const X = norm(cross(Z, HOME.U))
  return {
    HOME,
    JF: { X, Y: cross(X, Z), Z },
    RT_TAN: 1.25 * Math.max(tanX, tanY) * 1.22,
    ARR: arrival,
    ARR_K: w < h ? 1.22 : 1,
  }
}

export interface JourneyParams {
  /** Before the journey starts (t < 0). */
  home: boolean
  /** Proper distance from the throat; l > 0 is the home universe. */
  l: number
  lensOn: boolean
  /** Opacity of the page snapshot layer. */
  fade: number
  F: Vec3
  U: Vec3
  R: Vec3
  tanX: number
  tanY: number
  /** Field-of-view kick at the plunge. */
  fovK: number
  roll: number
  /** The wormhole mouth in normalized device coordinates. */
  mouthNdc: [number, number]
  /** How far behind the arrival pose the destination camera sits. */
  back: number
  /** The destination (Atlas) camera seen through the wormhole. */
  dest: CamBasis
  rim: number
  magGamma: number
  ctaGone: number
  pageKeep: number
  tube: number
  igR: number
  igA: number
  pull: number
  swirl: number
  ignite: number
  zoom: number
  ca: number
  exposure: number
  flash: number
  streak: number
  vig: number
  grain: number
  bloomK: number
  focus: [number, number]
}

/**
 * Parameters at wall-clock journey time `t` (seconds since the click).
 * `speed` above 1 plays the whole timeline faster (repeat visits).
 */
export function journeyParams(t: number, frames: JourneyFrames, speed = 1): JourneyParams {
  const { HOME, JF, ARR, ARR_K } = frames
  const home = t < 0
  const tt = Math.max(0, t * speed)

  let l = 1e5
  if (!home) {
    if (tt < J.open1) {
      const s = clamp01((tt - J.open0) / (J.open1 - J.open0))
      l = lFromR(1 / Math.sin(Math.max(2e-4, OPEN_CHI * Math.pow(smooth(s), 1.25))))
    } else if (tt < J.cross) {
      const s = (tt - J.open1) / (J.cross - J.open1)
      l = L1 * (1 - Math.pow(s, 2.3))
    } else {
      const s = clamp01((tt - J.cross) / (J.switch - J.cross))
      l = -(6.5 + WH.a) * (1 - Math.pow(1 - s, 2.0))
    }
  }

  const align = home ? 0 : smooth((tt - 0.28) / 1.05)
  const F = norm(slerp(HOME.F, JF.Z, align))
  let U = norm(sub(HOME.U, mul(F, dot(HOME.U, F))))
  const roll = home ? 0 : 7 * DEG * Math.sin(Math.PI * clamp01((tt - 1.0) / 1.9)) * (1 - smooth((tt - 2.55) / 0.6))
  const shake = home ? 0 : 0.5 * DEG * bump(tt, J.cross, 0.2) * Math.sin(tt * 91.7)
  U = norm(rot(U, F, roll + shake))
  const R = cross(F, U)
  const fovK = home ? 1 : 1 + 0.2 * bump(tt, 2.25, 0.42)
  const tanX = HOME.tanX * fovK
  const tanY = HOME.tanY * fovK
  const mz = dot(JF.Z, F)
  const mouthNdc: [number, number] = [dot(JF.Z, R) / mz / tanX, dot(JF.Z, U) / mz / tanY]

  const pull = home ? 0 : 1.15 * Math.pow(smooth((tt - 0.12) / 2.0), 1.4)
  const back = home ? 3.5 : 3.5 * (1 - easeOutBack((tt - 2.2) / 1.25, 1.6))
  const dest: CamBasis = { pos: add(mul(ARR.pos, ARR_K), mul(ARR.F, -back)), F: ARR.F, R: ARR.R, U: ARR.U }

  return {
    home,
    l,
    lensOn: !home && tt >= J.open0,
    fade: home ? 0 : 1 - smooth((tt - 2.62) / 0.5),
    F,
    U,
    R,
    tanX,
    tanY,
    fovK,
    roll,
    mouthNdc,
    back,
    dest,
    rim: home ? 0 : 0.2 * smooth((tt - 0.15) / 0.6) * (1 - smooth((tt - 2.3) / 0.15)) + 0.7 * bump(tt, 2.2, 0.07),
    magGamma: home || l <= 0 ? 1 : 1 + 0.85 * smooth((Math.abs(l) - 0.7) / 3.5),
    ctaGone: home ? 0 : smooth((tt - 0.06) / 0.3),
    pageKeep: home ? 1 : 1 - smooth((tt - 1.7) / 0.45),
    tube: home ? 0 : 0.6 * smooth((tt - 1.95) / 0.25) * (1 - smooth((tt - 2.42) / 0.22)),
    igR: 0.02 + 0.75 * smooth(tt / 0.6),
    igA: home ? 0 : 1.0 * bump(tt, 0.24, 0.14),
    pull,
    swirl: pull * 1.05,
    ignite: home ? 0 : bump(tt, 0.13, 0.07) * 1.6 + bump(tt, 0.24, 0.25) * 0.3,
    zoom: home ? 0 : 0.055 * smooth((tt - 1.5) / 0.7) * (1 - smooth((tt - 2.35) / 0.4)) + 0.05 * bump(tt, J.cross + 0.05, 0.12),
    ca: home ? 0 : 0.003 * bump(tt, J.cross, 0.25),
    exposure: home ? 1 : 1 + 0.22 * bump(tt, J.cross, 0.2),
    flash: 0,
    streak: 0,
    vig: home ? 0 : 0.5 * smooth(tt / 0.8),
    grain: home ? 0 : 0.026,
    bloomK: home ? 0 : 0.85,
    focus: [mouthNdc[0] * 0.5 + 0.5, mouthNdc[1] * 0.5 + 0.5],
  }
}
