import { test } from "node:test"
import assert from "node:assert/strict"
import { buildAtlasScene, starPosition, GALAXY_SCALE } from "../src/components/cosmos/engine/atlasScene.ts"
import type { SceneTopology } from "../src/components/cosmos/engine/atlasScene.ts"
import { len, sub } from "../src/components/cosmos/engine/vec3.ts"

const topo: SceneTopology = {
  domains: [
    { id: "obsidian", label: "OBSIDIAN", color: "#4fb5db", p: [0.05, 0.78, 0.22], works: [{ id: "obsidian:a", status: "released" }, { id: "obsidian:b", status: "released" }, { id: "obsidian:c", status: "in-progress" }], fictionCount: 0 },
    { id: "web", label: "WEB", color: "#3d63db", p: [0.82, 0.18, -0.25], works: [{ id: "web:a", status: "live" }], fictionCount: 0 },
    { id: "games", label: "GAMES", color: "#c76ea1", p: [-0.84, 0.3, 0.1], works: [], fictionCount: 0 },
    { id: "tools", label: "TOOLS", color: "#458cc7", p: [0.4, -0.62, 0.42], works: [], fictionCount: 0 },
    { id: "music", label: "MUSIC", color: "#f2ab47", p: [-0.52, -0.52, -0.34], works: [{ id: "music:a", status: "archive" }], fictionCount: 0 },
    { id: "writing", label: "WRITING", color: "#c78cdb", p: [0.3, 0.42, -0.82], elliptical: true, works: [{ id: "writing:a", status: "published" }], fictionCount: 7 },
    { id: "ai", label: "AI", color: "#8c4fd1", p: [-0.3, -0.2, 0.66], works: [], fictionCount: 0 },
    { id: "sites", label: "SITES", color: "#46c79c", p: [0.6, -0.25, -0.72], works: [], fictionCount: 0 },
  ],
}

test("the scene is deterministic", () => {
  const a = buildAtlasScene(topo, { pointsPerGalaxy: 300 })
  const b = buildAtlasScene(topo, { pointsPerGalaxy: 300 })
  assert.deepEqual(Array.from(a.galaxyPoints), Array.from(b.galaxyPoints))
  assert.deepEqual(Array.from(a.webPoints), Array.from(b.webPoints))
  assert.deepEqual(a.stars, b.stars)
})

test("galaxy buffers hold every particle plus a core and a halo per galaxy", () => {
  const s = buildAtlasScene(topo, { pointsPerGalaxy: 300 })
  assert.equal(s.galaxyPoints.length, 8 * 8 * (300 + 2))
  assert.equal(s.webPoints.length % 8, 0)
  assert.ok(s.webPoints.length > 0)
})

test("galaxy shape does not depend on the tier's point count", () => {
  const hi = buildAtlasScene(topo, { pointsPerGalaxy: 2600 })
  const lo = buildAtlasScene(topo, { pointsPerGalaxy: 1200 })
  assert.deepEqual(hi.galaxies.sizes, lo.galaxies.sizes)
  assert.deepEqual(Array.from(hi.galaxies.n), Array.from(lo.galaxies.n))
})

test("galaxies sit at their domain positions times the scale", () => {
  const s = buildAtlasScene(topo, { pointsPerGalaxy: 100 })
  topo.domains.forEach((d, i) => {
    d.p.forEach((v, k) => assert.ok(Math.abs(s.galaxies.cPos[i][k] - v * GALAXY_SCALE) < 1e-9))
  })
})

test("project stars ride the spiral at the specified radii", () => {
  const s = buildAtlasScene(topo, { pointsPerGalaxy: 100 })
  const obsidian = s.stars.filter((st) => st.domain === 0)
  assert.deepEqual(obsidian.map((st) => st.id), ["obsidian:a", "obsidian:b", "obsidian:c"])
  const size = s.galaxies.sizes[0]
  obsidian.forEach((st, i) => {
    const expected = size * (0.35 + (0.55 * i) / Math.max(1, obsidian.length - 1))
    assert.ok(Math.abs(st.rho - expected) < 1e-9)
    const p0 = starPosition(s, st, 0)
    const p9 = starPosition(s, st, 9)
    assert.ok(Math.abs(len(sub(p0, s.galaxies.cPos[0])) - expected) < 1e-9, "stays on its orbit")
    assert.ok(len(sub(p0, p9)) > 1e-4, "orbits with the galaxy")
  })
  const warm = obsidian[2].color
  assert.ok(warm[0] > warm[2], "in-progress work reads warm")
})

test("the fiction knot exists only when writing has stories", () => {
  const s = buildAtlasScene(topo, { pointsPerGalaxy: 100 })
  assert.ok(s.fictionKnot)
  assert.equal(s.fictionKnot!.domain, 5)
  const none = buildAtlasScene({ domains: topo.domains.map((d) => ({ ...d, fictionCount: 0 })) }, { pointsPerGalaxy: 100 })
  assert.equal(none.fictionKnot, null)
})

test("the black hole frame is orthonormal and faces the arrival camera edge-on", () => {
  const s = buildAtlasScene(topo, { pointsPerGalaxy: 100 })
  const [e1, n, e2] = s.bh.frame
  const d = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  assert.ok(Math.abs(d(e1, n)) < 1e-9 && Math.abs(d(e1, e2)) < 1e-9 && Math.abs(d(n, e2)) < 1e-9)
  const tilt = Math.asin(Math.abs(d(n, s.arrival.F)))
  assert.ok(tilt > 0.05 && tilt < 0.2, "the camera sits a few degrees above the disk")
})
