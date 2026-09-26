/**
 * Small 3-vector helpers for the cosmos engine. Pure: no DOM, GL, or React.
 * Tuples (not classes) so they serialize and test cheaply.
 */
export type Vec3 = [number, number, number]

/** Camera position plus a right-handed basis: R = F x U. */
export interface CamBasis {
  pos: Vec3
  F: Vec3
  R: Vec3
  U: Vec3
}

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
export const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2])
export const norm = (a: Vec3): Vec3 => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

/** Rodrigues rotation of v about the unit axis k by `ang` radians. */
export function rot(v: Vec3, k: Vec3, ang: number): Vec3 {
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  const kv = cross(k, v)
  const d = dot(k, v) * (1 - c)
  return [v[0] * c + kv[0] * s + k[0] * d, v[1] * c + kv[1] * s + k[1] * d, v[2] * c + kv[2] * s + k[2] * d]
}

/** Spherical interpolation between unit vectors. */
export function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const d = Math.min(1, Math.max(-1, dot(a, b)))
  const th = Math.acos(d)
  if (th < 1e-6) return [a[0], a[1], a[2]]
  const s = Math.sin(th)
  return add(mul(a, Math.sin((1 - t) * th) / s), mul(b, Math.sin(t * th) / s))
}

export function lookAt(pos: Vec3, target: Vec3, up: Vec3): CamBasis {
  const F = norm(sub(target, pos))
  const R = norm(cross(F, up))
  const U = cross(R, F)
  return { pos, F, R, U }
}

/**
 * Column-major view-projection matrix for a symmetric perspective frustum
 * with the given half-angle tangents. clip.w equals the view depth.
 */
export function viewProj(cam: CamBasis, tanX: number, tanY: number, near = 0.05, far = 400): Float32Array {
  const { pos, R, U, F } = cam
  const vw = [
    R[0], U[0], -F[0], 0,
    R[1], U[1], -F[1], 0,
    R[2], U[2], -F[2], 0,
    -dot(R, pos), -dot(U, pos), dot(F, pos), 1,
  ]
  const pr = [
    1 / tanX, 0, 0, 0,
    0, 1 / tanY, 0, 0,
    0, 0, -(far + near) / (far - near), -1,
    0, 0, (-2 * far * near) / (far - near), 0,
  ]
  const o = new Float32Array(16)
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += pr[k * 4 + r] * vw[c * 4 + k]
      o[c * 4 + r] = s
    }
  }
  return o
}
