/**
 * Scene data for the WebGL Atlas, built from the topology model. Pure and
 * deterministic: the same topology always produces byte-identical buffers.
 *
 * Ported from the approved prototype (docs/superpowers/specs/assets/
 * 2026-09-26-wormhole-study.html): the arrival camera, the Gargantua disk
 * frame, spiral/elliptical domain galaxies, and the dotted cosmic web. Added
 * here: projects as named stars that ride their galaxy's spiral, and the
 * Writing galaxy's fiction knot.
 */
import { add, sub, mul, cross, norm, rot, lookAt } from "./vec3.ts"
import type { Vec3, CamBasis } from "./vec3.ts"
import type { AtlasDomain, FictionStory } from "../../atlas/atlasShared.ts"

export const GALAXY_SCALE = 8.8
const DEG = Math.PI / 180

export interface SceneDomain {
  id: string
  label: string
  color: string
  p: Vec3
  elliptical?: boolean
  works: { id: string; status: string }[]
  fictionCount: number
}

/** The eight galaxies (the core domain is the black hole, not a galaxy). */
export interface SceneTopology {
  domains: SceneDomain[]
}

/** A project star (or the fiction knot), parametrized like galaxy particles. */
export interface SceneStar {
  id: string
  domain: number
  rho: number
  th0: number
  h: number
  color: Vec3
  size: number
}

export interface AtlasSceneData {
  arrival: CamBasis
  target0: Vec3
  bandN: Vec3
  bh: { rs: number; pos: Vec3; frame: [Vec3, Vec3, Vec3]; outer: number }
  galaxies: {
    c: Float32Array
    e1: Float32Array
    e2: Float32Array
    n: Float32Array
    sizes: number[]
    cPos: Vec3[]
    e1v: Vec3[]
    e2v: Vec3[]
    nv: Vec3[]
    colors: Vec3[]
  }
  /** 8 floats per point: gi, rho, theta0, h, r, g, b, size. */
  galaxyPoints: Float32Array
  /** 8 floats per point: x, y, z, u, seed, speed, base, size. */
  webPoints: Float32Array
  stars: SceneStar[]
  fictionKnot: SceneStar | null
  domainIds: string[]
}

// Constellation between galaxies, indices into the eight galaxies:
// [obsidian, web, games, tools, music, writing, ai, sites].
const EDGES: [number, number][] = [[0, 1], [1, 3], [2, 5], [5, 0], [4, 3], [6, 3], [6, 1], [1, 7]]

function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function gaussFrom(rng: () => number): () => number {
  return () => {
    let u = 0
    while (!u) u = rng()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
  }
}
function hexLin(h: string): Vec3 {
  const n = parseInt(h.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((c) => Math.pow(c, 2.2)) as Vec3
}
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

function statusColor(status: string): Vec3 {
  if (status === "in-progress") return [1, 0.72, 0.38]
  if (status === "archive") return [0.55, 0.62, 0.78]
  return [0.82, 0.9, 1]
}

/** Map the Atlas model to the galaxy topology (skips the core domain). */
export function topologyFromModel(model: { domains: AtlasDomain[]; fiction: FictionStory[] }): SceneTopology {
  return {
    domains: model.domains
      .filter((d) => !d.core)
      .map((d) => ({
        id: d.id,
        label: d.label,
        color: d.c,
        p: [d.p[0], d.p[1], d.p[2]] as Vec3,
        elliptical: d.id === "writing",
        works: (d.works || []).map((w) => ({ id: w.id || `${d.id}:${w.t}`, status: w.status || "released" })),
        fictionCount: d.id === "writing" ? model.fiction.length : 0,
      })),
  }
}

export function buildAtlasScene(topo: SceneTopology, opts: { pointsPerGalaxy: number; seed?: number }): AtlasSceneData {
  const seed = opts.seed ?? 20260926
  const bandN = norm([0.32, 1, 0.18])
  const target0: Vec3 = [0, 0.3, 0]
  const az = 0.42
  const el = 0.2
  const dist = 24
  const arrival = lookAt(
    [Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist],
    target0,
    [0, 1, 0]
  )

  const rs = 0.5
  let bhN = norm(sub(mul(arrival.U, Math.cos(6 * DEG)), mul(arrival.F, Math.sin(6 * DEG))))
  bhN = norm(rot(bhN, arrival.F, -4 * DEG))
  const bhE1 = norm(cross(bhN, arrival.F))
  const bhE2 = cross(bhE1, bhN)
  const bh = { rs, pos: [0, 0, 0] as Vec3, frame: [bhE1, bhN, bhE2] as [Vec3, Vec3, Vec3], outer: rs * 7.5 }

  const N = opts.pointsPerGalaxy
  const galaxyPoints = new Float32Array(topo.domains.length * (N + 2) * 8)
  const cArr: number[] = []
  const e1Arr: number[] = []
  const e2Arr: number[] = []
  const nArr: number[] = []
  const sizes: number[] = []
  const pitches: number[] = []
  const cPos: Vec3[] = []
  const e1v: Vec3[] = []
  const e2v: Vec3[] = []
  const nv: Vec3[] = []
  const colors: Vec3[] = []
  let o = 0
  const put = (...v: number[]) => {
    for (const x of v) galaxyPoints[o++] = x
  }

  topo.domains.forEach((dm, gi) => {
    // Shape and particles draw from separate streams so the galaxy's shape
    // does not change with the tier's point count.
    const shapeRng = mulberry32(seed + gi * 7919)
    const shapeGauss = gaussFrom(shapeRng)
    const rng = mulberry32(seed + gi * 7919 + 104729)
    const gauss = gaussFrom(rng)

    const c = mul(dm.p, GALAXY_SCALE)
    const rnd = norm([shapeGauss(), shapeGauss(), shapeGauss()])
    const n = norm(add(mul(arrival.F, -0.75), mul(rnd, 0.85)))
    const e1 = norm(cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]))
    const e2 = cross(n, e1)
    const size = 1.5 + shapeRng() * 0.6
    const pitch = 0.3 + shapeRng() * 0.14
    cArr.push(...c)
    e1Arr.push(...e1)
    e2Arr.push(...e2)
    nArr.push(...n)
    sizes.push(size)
    pitches.push(pitch)
    cPos.push(c)
    e1v.push(e1)
    e2v.push(e2)
    nv.push(n)
    const col = hexLin(dm.color)
    colors.push(col)

    for (let i = 0; i < N; i++) {
      let rho: number, th: number, h: number, inten: number, sz: number, cc: Vec3
      if (i < N * 0.16) {
        rho = Math.abs(gauss()) * size * 0.11
        th = rng() * Math.PI * 2
        h = gauss() * size * 0.06
        cc = mix3(col, [1, 0.93, 0.86], 0.72)
        inten = 0.8 + rng() * 0.8
        sz = 0.04
      } else if (!dm.elliptical) {
        const t = Math.pow(rng(), 0.85)
        rho = size * (0.07 + 0.93 * t)
        th = (i % 2) * Math.PI + Math.log((rho / size) * 9 + 1) / Math.tan(pitch) + gauss() * 0.26 * (1 - 0.35 * t)
        h = gauss() * size * 0.022
        cc = mix3([0.82, 0.88, 1.0], col, 0.3 + 0.55 * t)
        inten = (0.32 + rng() * 0.6) * (1.3 - t)
        sz = 0.024 + rng() * 0.02
      } else {
        rho = Math.abs(gauss()) * size * 0.42
        th = rng() * Math.PI * 2
        h = gauss() * size * 0.24
        cc = mix3([1, 0.9, 0.84], col, 0.45)
        inten = 0.22 + rng() * 0.38
        sz = 0.03
      }
      if (rng() < 0.028) {
        inten *= 4.5
        sz *= 1.9
      }
      put(gi, rho, th, h, cc[0] * inten, cc[1] * inten, cc[2] * inten, sz)
    }
    const core = mix3(col, [1, 1, 1], 0.55)
    put(gi, 0, 0, 0, core[0] * 3.2, core[1] * 3.2, core[2] * 3.2, 0.3)
    put(gi, 0, 0, 0, core[0] * 0.3, core[1] * 0.3, core[2] * 0.3, 1.7)
  })

  // Dotted cosmic web: from the black hole to every galaxy, plus the
  // canonical constellation between galaxies.
  const web: number[] = []
  const addEdge = (A: Vec3, B: Vec3, startR: number, s: number) => {
    const mid = mul(add(A, B), 0.5)
    const dir = sub(B, A)
    const dirLen = Math.hypot(dir[0], dir[1], dir[2])
    const off = mul(norm(cross(dir, add(arrival.U, [0.1, 0, 0.1]))), dirLen * 0.12 * (s % 2 ? 1 : -1))
    const ctrl = add(mid, off)
    const count = 110
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1)
      const p = add(add(mul(A, (1 - u) * (1 - u)), mul(ctrl, 2 * u * (1 - u))), mul(B, u * u))
      if (Math.hypot(p[0], p[1], p[2]) < startR) continue
      web.push(p[0], p[1], p[2], u, (s * 0.137) % 1, 0.05 + (s % 3) * 0.02, 0.05 + 0.03 * Math.sin(u * 40 + s), 0.028)
    }
  }
  cPos.forEach((c, i) => addEdge([0, 0, 0], c, bh.outer * 1.35, i + 1))
  EDGES.forEach(([a, b], k) => {
    if (cPos[a] && cPos[b]) addEdge(cPos[a], cPos[b], 0, k + 11)
  })

  // Projects as named stars along each galaxy's spiral (golden-angle ring for
  // the elliptical Writing galaxy).
  const stars: SceneStar[] = []
  let fictionKnot: SceneStar | null = null
  topo.domains.forEach((dm, gi) => {
    const size = sizes[gi]
    const n = dm.works.length
    dm.works.forEach((w, i) => {
      const rho = size * (0.35 + (0.55 * i) / Math.max(1, n - 1))
      const th0 = dm.elliptical
        ? i * 2.39996 + 0.6
        : (i % 2) * Math.PI + Math.log((rho / size) * 9 + 1) / Math.tan(pitches[gi])
      stars.push({ id: w.id, domain: gi, rho, th0, h: 0, color: statusColor(w.status), size: 0.13 })
    })
    if (dm.fictionCount > 0) {
      fictionKnot = {
        id: `${dm.id}:fiction`,
        domain: gi,
        rho: size * Math.hypot(0.55, 0.2),
        th0: Math.atan2(0.2, 0.55),
        h: 0,
        color: [0.86, 0.74, 1],
        size: 0.2,
      }
    }
  })

  return {
    arrival,
    target0,
    bandN,
    bh,
    galaxies: {
      c: new Float32Array(cArr),
      e1: new Float32Array(e1Arr),
      e2: new Float32Array(e2Arr),
      n: new Float32Array(nArr),
      sizes,
      cPos,
      e1v,
      e2v,
      nv,
      colors,
    },
    galaxyPoints,
    webPoints: new Float32Array(web),
    stars,
    fictionKnot,
    domainIds: topo.domains.map((d) => d.id),
  }
}

/**
 * World position of a star at `time` seconds. Mirrors the differential
 * rotation in the galaxy vertex shader: theta = theta0 + t * 0.05 / max(rho + 0.15, 0.2).
 */
export function starPosition(scene: AtlasSceneData, star: SceneStar, time: number): Vec3 {
  const g = scene.galaxies
  const th = star.th0 + (time * 0.05) / Math.max(star.rho + 0.15, 0.2)
  const radial = add(mul(g.e1v[star.domain], Math.cos(th)), mul(g.e2v[star.domain], Math.sin(th)))
  return add(add(g.cPos[star.domain], mul(radial, star.rho)), mul(g.nv[star.domain], star.h))
}
