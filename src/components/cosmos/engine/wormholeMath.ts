/**
 * Wormhole geometry for the home-to-Atlas journey. Pure.
 *
 * Ellis-type traversable wormhole after James, von Tunzelmann, Franklin and
 * Thorne, "Visualizing Interstellar's Wormhole" (Am. J. Phys. 83, 486, 2015):
 * throat radius rho = 1, a cylindrical interior of half-length `a`, and a
 * lensing width set by `M`. `l` is proper radial distance; l > 0 is the home
 * universe, l < 0 the Atlas universe.
 *
 * The shaders ray-trace against this geometry through a per-frame 1D lookup
 * table indexed by the angle chi between a view ray and the throat direction.
 * The table's sample density follows `lutMapFor`, concentrated around the
 * apparent sphere edge chiS where the lensing is strongest.
 */
export const WH = { a: 1.6, M: 0.34 }

/** Angular radius the sphere grows to during the opening beat. */
export const OPEN_CHI = (7.5 * Math.PI) / 180

/** Samples in the per-frame lensing lookup table (high tier). */
export const LUT_W = 4096

/** Circumferential radius r(l) of the wormhole at proper distance l. */
export function rOf(l: number): number {
  const x = Math.max(Math.abs(l) - WH.a, 0)
  const xx = (2 * x) / (Math.PI * WH.M)
  return 1 + WH.M * (xx * Math.atan(xx) - 0.5 * Math.log(1 + xx * xx))
}

/** dr/dl. Zero inside the cylinder, tends to +-1 far away. */
export function drOf(l: number): number {
  const x = Math.abs(l) - WH.a
  if (x <= 0) return 0
  const xx = (2 * x) / (Math.PI * WH.M)
  return (l > 0 ? 1 : -1) * (2 / Math.PI) * Math.atan(xx)
}

/** Inverse of rOf on l >= 0 by bisection; 0 for r <= 1. */
export function lFromR(r: number): number {
  if (r <= 1) return 0
  let lo = 0
  let hi = r + 6
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2
    if (rOf(m) < r) lo = m
    else hi = m
  }
  return (lo + hi) / 2
}

/** [chiS, c1, c2, 0]: sphere edge angle and the LUT's segment boundaries. */
export type LutMap = [number, number, number, number]

export function lutMapFor(L: number): LutMap {
  const chiS = Math.asin(Math.min(1, 1 / rOf(L)))
  const c2 = Math.min(Math.PI * 0.98, Math.max(chiS * 1.8, chiS + 0.02))
  return [chiS, chiS * 0.9, c2, 0]
}

/**
 * LUT coordinate u in [0,1] -> view angle chi. 40% of samples cover the sphere
 * interior, 35% the edge band, the rest the outside with quadratic spacing.
 * Must match `chiFromU` in the LUT shader and `uFromChi` in the lens shader.
 */
export function chiFromU(u: number, map: LutMap): number {
  const c1 = map[1]
  const c2 = map[2]
  if (u < 0.4) return (c1 * u) / 0.4
  if (u < 0.75) return c1 + ((c2 - c1) * (u - 0.4)) / 0.35
  const s = (u - 0.75) / 0.25
  return c2 + (Math.PI - c2) * s * s
}

export function uFromChi(chi: number, map: LutMap): number {
  const c1 = map[1]
  const c2 = map[2]
  if (chi < c1) return (0.4 * chi) / c1
  if (chi < c2) return 0.4 + (0.35 * (chi - c1)) / (c2 - c1)
  return 0.75 + 0.25 * Math.sqrt(Math.max((chi - c2) / (Math.PI - c2), 0))
}
