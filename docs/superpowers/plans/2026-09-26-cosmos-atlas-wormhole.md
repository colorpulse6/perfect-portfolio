# Cosmos Atlas and Wormhole Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved prototype on the live site. That means a physically lensed wormhole journey from the home CTA into a WebGL Atlas (Gargantua core, eight domain galaxies, zoom and fly-to, projects as named stars), with every existing Atlas content path preserved.

**Architecture:** A framework-free WebGL2 engine (`src/components/cosmos/engine/`) is ported from the prototype. It is hosted by one `CosmosStage` canvas that stays mounted in the persistent Gatsby layout. React talks to the engine through a small external store and a command API. The Atlas HUD is extracted from `AtlasCanvas.tsx` and shared by the new Atlas and the legacy fallback.

**Tech Stack:** Gatsby 5, React 18, TypeScript 5.8, raw WebGL2 (GLSL ES 3.00), Node 22 test runner with `--experimental-strip-types`, headless Chrome over CDP for visual checks.

**Spec:** `docs/superpowers/specs/2026-09-26-cosmos-atlas-wormhole-design.md`

**Canonical source for ported code:** `docs/superpowers/specs/assets/2026-09-26-wormhole-study.html`, cited below as `PROTO:<lines>`.

---

## Execution notes

- The plan author executes this plan inline, per Nic's economy rules. That
  means one implementer and one combined review per milestone, through
  `~/.local/bin/agent-router run --role reviewer --author claude`. There are
  no per-task reviewer loops.
- Work happens only in the worktree
  `/Users/nichalasbarnes/Desktop/projects/perfect-portfolio/.worktrees/cosmos-atlas`
  on branch `feat/cosmos-atlas`. Never switch the main checkout's branch: the
  newsletter automation commits there.
- Commit after every task. Nothing merges to `master` or deploys until Nic
  tests locally and approves.
- Every commit message ends with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Conventions (apply to every task)

1. **Pure modules** (`engine/vec3.ts`, `engine/wormholeMath.ts`,
   `engine/journeyTimeline.ts`, `engine/orbitCamera.ts`,
   `engine/atlasScene.ts`, `engine/labels.ts`, `engine/picking.ts`,
   `src/components/atlas/buildAtlasModel.ts`):
   - No DOM, GL, React or asset imports.
   - Relative imports use explicit `.ts` extensions. Type-only imports use
     `import type`.
2. **SSR safety:** no `window`, `document` or WebGL access at module top level
   in anything the layout or pages import. Touch the browser only inside
   effects or functions called on the client.
3. **ES5 downlevel gotcha:** never `class X extends SomeLibraryClass`. Plain
   classes of our own and closures are fine.
4. **Copy:** no em-dashes in user-visible text.
5. **Debug hook:** `window.__cosmos` (goto, state, frames) is attached only
   when the URL contains `cosmos-debug`. The capture harness uses it.
6. **Ports:** copy GLSL and math verbatim from the prototype unless a step
   states a delta. Visual regressions are caught by comparing captures
   against `docs/superpowers/specs/assets/*.jpg`.

## File map

| Path | Responsibility |
|---|---|
| `src/components/cosmos/engine/vec3.ts` | Vector helpers, `lookAt`, `viewProj` (pure) |
| `src/components/cosmos/engine/wormholeMath.ts` | Wormhole constants, `rOf`, `lFromR`, LUT mapping `chiFromU`/`uFromChi`/`lutMapFor` (pure) |
| `src/components/cosmos/engine/journeyTimeline.ts` | `J`, `journeyParams(t, frames)` ported from `PROTO:1054-1104` (pure) |
| `src/components/cosmos/engine/orbitCamera.ts` | Orbit state, smoothing, inertia, zoom-to-cursor, fly-to, reset, keep-out (pure) |
| `src/components/cosmos/engine/atlasScene.ts` | Galaxy particles, web points, project stars, black-hole frame, arrival camera from the topology model (pure) |
| `src/components/cosmos/engine/labels.ts` | Label placement math: outward, leader line, clamp (pure) |
| `src/components/cosmos/engine/picking.ts` | Screen-space pick of core, galaxies, project stars, fiction knot (pure) |
| `src/components/cosmos/engine/quality.ts` | Tier detection and per-tier settings |
| `src/components/cosmos/engine/shaders/*.ts` | GLSL strings: `common`, `vertex`, `lut`, `nebula`, `sky`, `blackHole`, `lens`, `post` |
| `src/components/cosmos/engine/gl.ts` | Context, programs (parallel compile), targets, fullscreen geometry, uniforms |
| `src/components/cosmos/engine/resources.ts` | Programs, VAOs, nebula cube map, LUT targets, size-dependent targets |
| `src/components/cosmos/engine/renderAtlas.ts` | Sky, black hole, web, galaxies, project stars into a target |
| `src/components/cosmos/engine/renderJourney.ts` | LUT update and lens pass |
| `src/components/cosmos/engine/post.ts` | Bloom chain and composite |
| `src/components/cosmos/engine/input.ts` | Atlas pointer, wheel, pinch, double-click, keys to orbit and pick events |
| `src/components/cosmos/engine/journeyAudio.ts` | Synthesized score (`PROTO:1284-1320`) |
| `src/components/cosmos/engine/stage.ts` | Mode machine, loop, commands, adaptive resolution, label writer |
| `src/components/cosmos/cosmosStore.ts` | External store and `useCosmos` hook |
| `src/components/cosmos/CosmosStage.tsx` | Mounts the canvas and stage, maps path to mode, feeds topology |
| `src/components/cosmos/useAtlasTopology.ts` | Small static query to topology model |
| `src/components/cosmos/particleCapture.ts` | One-shot same-frame capture registry for the R3F particle canvas |
| `src/components/cosmos/homeSnapshot.ts` | DOM rasterizer for the home hand-off |
| `src/components/cosmos/cosmos.css` | Stage layering, journey hiding, HUD fade |
| `src/components/atlas/buildAtlasModel.ts` | Pure model builder moved out of `atlas.tsx` |
| `src/components/atlas/AtlasHud.tsx` | HUD extracted from `AtlasCanvas.tsx` |
| `src/components/atlas/AtlasTerminal.tsx` | Terminal extracted from `AtlasCanvas.tsx` |
| `src/components/atlas/CosmosAtlas.tsx` | New Atlas view bound to the store |
| `src/components/atlas/AtlasLabels.tsx` | Label nodes registered with the stage |
| `src/components/atlas/AtlasPreviewCard.tsx` | Hover preview card |
| `src/components/atlas/AtlasA11yNav.tsx` | Accessible navigation list |
| `scripts/cosmos-capture.mjs` | Headless Chrome capture and perf harness (dev tool) |
| `test/cosmos-*.test.ts` | Unit tests for the pure modules |

Modified:

- `package.json` (test scripts).
- `tsconfig.json` (`allowImportingTsExtensions`).
- `src/components/layout.tsx`.
- `src/pages/index.tsx`.
- `src/pages/atlas.tsx`.
- `src/components/atlas/AtlasCanvas.tsx`.
- `src/components/nebula/ParticleBackground.tsx`.
- `test/atlas-project-rail.test.mjs`.
- `test/project-disable-and-sector-zero-site.test.mjs`.
- `CLAUDE.md`.

Deleted: `src/components/atlas/AtlasDive.tsx`.

---

## Milestone 1: Stage and WebGL Atlas

### Task 1: Test wiring and TypeScript import extensions

**Files:** Modify `package.json`, `tsconfig.json`. Create `test/cosmos-smoke.test.ts` (deleted in Task 2).

- [ ] **Step 1:** In `package.json` scripts, set
  `"test": "node --test test/*.test.mjs && npm run test:cosmos"`. Also add
  `"test:cosmos": "node --experimental-strip-types --test test/cosmos-*.test.ts"`.
- [ ] **Step 2:** In `tsconfig.json` `compilerOptions`, add
  `"allowImportingTsExtensions": true`.
- [ ] **Step 3:** Write the smoke test `test/cosmos-smoke.test.ts`:

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
test("cosmos test lane runs TypeScript", () => { const n: number = 2; assert.equal(n * 2, 4) })
```

- [ ] **Step 4:** Run `npm test`. Expected: the existing 36 tests pass, plus
  `# pass 1` from the cosmos lane.
- [ ] **Step 5:** Run `npm run type-check`. Expected: exit 0.
- [ ] **Step 6:** Commit: `chore: add the cosmos TypeScript test lane`.

### Task 2: Vector helpers

**Files:** Create `src/components/cosmos/engine/vec3.ts`, `test/cosmos-vec3.test.ts`. Delete `test/cosmos-smoke.test.ts`.

- [ ] **Step 1: Failing test.** `test/cosmos-vec3.test.ts` asserts these:
  - `norm([3,0,4])` is `[0.6,0,0.8]`.
  - `cross([1,0,0],[0,1,0])` is `[0,0,1]`.
  - `rot([1,0,0],[0,0,1],PI/2)` is about `[0,1,0]`.
  - `slerp(a,b,0.5)` is unit length, and so is `lookAt`'s right vector.
  - `lookAt([0,0,10],[0,0,0],[0,1,0])` gives `F=[0,0,-1]`, `R=[1,0,0]`,
    `U=[0,1,0]`.
  - `viewProj` maps the look-at target to clip `x=y=0`, `w=distance`.
- [ ] **Step 2:** Run `npm run test:cosmos`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement.** `vec3.ts` ports `V`, `lookAt` and `viewProj`
  from `PROTO:127-139,1106-1113` with types. `export type Vec3 = [number, number, number]`;
  `export interface CamBasis { pos: Vec3; F: Vec3; R: Vec3; U: Vec3 }`.
  Functions: `add, sub, mul, dot, cross, norm, rot, slerp, len, lookAt,
  viewProj(cam, tanX, tanY): Float32Array`.
- [ ] **Step 4:** Run `npm run test:cosmos`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(cosmos): add vector helpers`.

### Task 3: Wormhole math

**Files:** Create `src/components/cosmos/engine/wormholeMath.ts`, `test/cosmos-wormhole-math.test.ts`.

- [ ] **Step 1: Failing test.** It asserts:
  - `WH` is `{ a: 1.6, M: 0.34 }`.
  - `rOf(0)` is 1, `rOf(WH.a)` is 1, and `rOf` is strictly increasing for
    `l > WH.a` (sample 200 points).
  - `lFromR(rOf(l))` is within 1e-6 of `l` for `l` in [WH.a, 200].
  - `lutMapFor(L)` returns `[chiS, 0.9*chiS, c2, 0]` with
    `chiS = asin(min(1, 1/rOf(L)))`.
  - `uFromChi(chiFromU(u, map), map)` is within 1e-6 of `u` for u in [0, 1]
    across `L` in {0, 1, 5, 50}.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.** Port `PROTO:141-143` plus the GLSL `chiFromU`
  (`PROTO:309-314`) and `uFromChi` (from the lens shader) as TypeScript. The
  map in the prototype's `updateLut` (`PROTO:871-885`) becomes `lutMapFor(L)`.
  Export `WH, rOf, drOf, lFromR, lutMapFor, chiFromU, uFromChi,
  OPEN_CHI = 7.5 * PI / 180, LUT_W = 4096`.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(cosmos): port the wormhole geometry math`.

### Task 4: Orbit camera

**Files:** Create `src/components/cosmos/engine/orbitCamera.ts`, `test/cosmos-orbit-camera.test.ts`.

Interface:

```ts
export interface OrbitState { T: Vec3; Td: Vec3; D: number; Dd: number; az: number; azD: number; el: number; elD: number; vAz: number; vEl: number; rate: number; lastInput: number }
export interface OrbitConfig { target0: Vec3; basePos: Vec3; zMin: number; zMax: number; keepOut: number; targetRadius: number }
export function createOrbit(cfg: OrbitConfig): OrbitState
export function orbitCamera(o: OrbitState, cfg: OrbitConfig, back: number): CamBasis
export function stepOrbit(o: OrbitState, dt: number, opts: { dragging: boolean; autoDrift: boolean; now: number }): void
export function zoomAt(o: OrbitState, cfg: OrbitConfig, cam: CamBasis, ndc: [number, number], tan: [number, number], k: number, rate: number, now: number): void
export function flyTo(o: OrbitState, target: Vec3, dist: number, rate: number, now: number): void
export function resetOrbit(o: OrbitState, cfg: OrbitConfig, hard: boolean): void
```

- [ ] **Step 1: Failing test.**
  - `orbitCamera` of a fresh orbit equals `lookAt(basePos, target0, Y)`.
  - After `zoomAt` at `ndc=[0.4,0.2]` with `k=0.5`, then stepping until the
    orbit settles, the world point that sat under that ndc on the target
    plane projects back to the same ndc (within 1e-3). This is the
    zoom-to-cursor invariant.
  - `Dd` clamps to [zMin, zMax].
  - The camera position never lies closer than `keepOut` to the origin.
  - `resetOrbit(o, cfg, false)` sets `azD` to the nearest multiple of 2π at
    or below `az`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.** Port `OR`, `resetOrbit`, `atlasCam`, `zoomAt`,
  `focusAt`'s target logic and the frame-loop smoothing
  (`PROTO:1321-1406`, `PROTO:1407-1430`) as pure functions with the
  interface above. `zMin 0.12`, `zMax 2.6`, `keepOut 4.75`,
  `targetRadius 11`.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(cosmos): add the orbit camera with zoom-to-cursor`.

### Task 5: Pure Atlas model builder

**Files:** Create `src/components/atlas/buildAtlasModel.ts`, `test/cosmos-atlas-model.test.ts`. Modify `src/pages/atlas.tsx`, `test/project-disable-and-sector-zero-site.test.mjs`.

Interface:

```ts
export interface AtlasSourceData { projects: ProjectNode[]; writing: { title: string; content?: string }[]; changelog: MarkdownNode[] }
export interface AtlasModel { domains: AtlasDomain[]; fiction: FictionStory[]; essays: EssayItem[]; changelog: ChangelogItem[] }
export function buildAtlasModel(data: AtlasSourceData, opts: { resolveMedia: (name: string, imgSrc: string) => string | null }): AtlasModel
export function workId(domainId: string, title: string, seen: Map<string, number>): string
```

- [ ] **Step 1: Failing test.**
  - Disabled projects are excluded.
  - Domain order is `[me, obsidian, web, games, tools, music, writing, ai, sites]`.
  - Every work has an `id`, the ids are unique, and a duplicated essay title
    gets a `-2` suffix.
  - Topology input (no `content`, no descriptions) and full input produce
    identical id lists.
  - `resolveMedia` is called for projects and the curated Cerebro Mycelium.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Move the `useMemo` body of `atlas.tsx` (`src/pages/atlas.tsx:113-307`)
    into `buildAtlasModel`, together with `CTA_CLUSTER`, `CTA_NAME` and
    `CURATED` (media now via `opts.resolveMedia`).
  - Add `id` to `AtlasWork` in `atlasShared.ts` as an optional
    `id?: string`, and assign it with `workId`.
  - Import `NB` from `./atlasShared.ts`.
  - `atlas.tsx` then calls `buildAtlasModel(sourceFromQuery(data), { resolveMedia: resolveProjectMedia })`
    inside `useMemo`.
- [ ] **Step 4:** Update `test/project-disable-and-sector-zero-site.test.mjs`
  lines 52-57. Read `src/components/atlas/buildAtlasModel.ts`, and assert
  `disabled?: boolean`, `projects.filter(p => p.disabled !== true)` and the
  per-cluster filter there.
- [ ] **Step 5:** Run `npm test && npm run type-check`. Expected: all pass.
- [ ] **Step 6:** Commit: `refactor(atlas): move the Atlas model into a pure builder`.

### Task 6: Atlas scene data

**Files:** Create `src/components/cosmos/engine/atlasScene.ts`, `test/cosmos-atlas-scene.test.ts`.

Interface:

```ts
export interface SceneTopology { domains: { id: string; label: string; tag: string; color: string; p: Vec3; elliptical: boolean; works: { id: string; t: string; status: string; kind?: string }[]; fictionCount?: number }[] }
export interface AtlasSceneData {
  arrival: CamBasis; target0: Vec3; bandN: Vec3
  bh: { rs: number; pos: Vec3; frame: [Vec3, Vec3, Vec3]; outer: number }
  galaxies: { centers: Float32Array; e1: Float32Array; e2: Float32Array; n: Float32Array; sizes: number[]; cPos: Vec3[] }
  galaxyPoints: Float32Array   // 8 floats per point: gi, rho, theta, h, r, g, b, size
  webPoints: Float32Array      // 8 floats per point: x, y, z, u, seed, speed, base, size
  projectStars: { id: string; domain: number; pos: Vec3; color: Vec3; size: number }[]
  fictionKnot: { domain: number; pos: Vec3 } | null
}
export function buildAtlasScene(topo: SceneTopology, opts: { pointsPerGalaxy: number; seed?: number }): AtlasSceneData
```

- [ ] **Step 1: Failing test.**
  - The same input gives byte-identical arrays.
  - `galaxyPoints.length === 8 * (8 * (pointsPerGalaxy + 2))`.
  - Galaxy centers equal `p * 8.8`.
  - `projectStars` lie within each galaxy's radius, at
    `size * (0.35 + 0.55 * i / max(1, n - 1))` from the center (±1e-6).
  - Writing's fiction knot exists only when `fictionCount > 0`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Port `BAND_N`, `ARR`, `BH`, `EDGES`, `SCALE`, the galaxy generation and
    the web generation (`PROTO:737-834`), using `mulberry32` seeded with
    20260926.
  - Add project stars: per domain, the work `i` of `n` sits at radius `r`
    along arm `(i % 2) * PI`. Its angle follows the same log spiral as the
    arms, and its height is 0.
  - Star color by status: `released`/`live` are `[0.82,0.9,1]`,
    `in-progress` is `[1,0.72,0.38]`, `archive` is `[0.55,0.62,0.78]`.
  - Writing: essays go on arm 0. The fiction knot sits at
    `center + e1*size*0.55 + e2*size*0.2`.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(cosmos): build the Atlas scene data from topology`.

### Task 7: Label placement and picking

**Files:** Create `src/components/cosmos/engine/labels.ts`, `src/components/cosmos/engine/picking.ts`, `test/cosmos-labels.test.ts`, `test/cosmos-picking.test.ts`.

- [ ] **Step 1: Failing tests.**
  - `placeLabel({anchor, center, radiusPx, labelW, labelH, viewport, safe})`
    returns `{left, top, lineFrom, lineTo, alignRight}`. The label sits
    outward from `center`, past `radiusPx`, and is clamped inside
    `[safe.l, W - safe.r] x [safe.t, H - safe.b]`. The line starts at
    `0.5 * radiusPx` (capped at 70px).
  - `pick(targets, x, y, touch)` returns the nearest target whose radius
    contains the point. Radius is `max(target.r, touch ? 22 : 14)`. Project
    stars beat galaxies when both hit. It returns null on empty space.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement.** Port `placeLabels` (`PROTO:1229-1283`) as pure
  math. Write `pick` as described.
- [ ] **Step 4:** Run them. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(cosmos): add label placement and picking math`.

### Task 8: Shaders

**Files:** Create `src/components/cosmos/engine/shaders/{common,vertex,lut,nebula,sky,blackHole,lens,post}.ts`.

- [ ] **Step 1:** Port the GLSL verbatim, one exported const per shader:
  - `common.ts`: `HEAD`, `COMMON` (`PROTO:152-229`).
  - `vertex.ts`: `VS_TRI`, `VS_QUAD`, `VS_GAL`, `VS_WEB` (`PROTO:230-292`).
  - `post.ts`: `FS_PT` (`PROTO:293-296`), plus `FS_DOWN`, `FS_UP` and
    `FS_COMP` (`PROTO:582-650`).
  - `lut.ts`: `FS_LUT` (`PROTO:297-341`).
  - `nebula.ts`: `FS_NEB` (`PROTO:342-370`).
  - `sky.ts`: `FS_SKY` (`PROTO:371-375`).
  - `blackHole.ts`: `FS_BH` (`PROTO:376-444`).
  - `lens.ts`: `FS_LENS` (`PROTO:445-581`).

  Deltas:
  - `VS_GAL` adds `uniform float uGDim[8];`, multiplying `vCol` by
    `uGDim[gi]` (dims non-entered galaxies).
  - Add `VS_STAR` for project stars. Attributes are `aPos` (vec3),
    `aCol` (vec3) and `aSize` (float). Uniforms are `uHover` (float index),
    `uVisible` and `uTime`. The core is 2.2x brighter when hovered, and a
    slow twinkle is added. It reuses the black-hole shadow occlusion from
    `VS_GAL`.
  - `VS_WEB` adds a `uDim` uniform.
  - Balanced tier: `common.ts` exports `destSky` with the third star layer
    behind `#ifdef COSMOS_HIGH`. `gl.ts` prepends `#define COSMOS_HIGH` on the
    high tier.
- [ ] **Step 2:** Run `npm run type-check`. Expected: exit 0.
- [ ] **Step 3:** Commit: `feat(cosmos): port the GLSL shaders`.

### Task 9: GL core, resources, Atlas render, post

**Files:** Create `src/components/cosmos/engine/{gl,resources,renderAtlas,post,quality}.ts`.

- [ ] **Step 1: `gl.ts`.**
  - `createGL(canvas)` returns `{ gl, aniso, parallel } | { error }`. It
    requires WebGL2 and `EXT_color_buffer_float`, uses
    `powerPreference: 'high-performance'`, and adds `webglcontextlost` and
    `webglcontextrestored` listeners that call supplied callbacks.
  - `compileProgram(gl, vs, fs, defines)`: when `KHR_parallel_shader_compile`
    exists, it returns a program handle whose `ready()` polls
    `COMPLETION_STATUS_KHR`.
  - Also port `U`, `tex2D`, `target`, `freeTarget`, `bindTex`, `drawTri` and
    `drawQuad` (`PROTO:651-719`).
- [ ] **Step 2: `quality.ts`.**
  - `detectTier()` returns `'high' | 'balanced'`. The rule: balanced when
    `(pointer: coarse)` matches and `min(screen.width, screen.height) <= 900`,
    or when `navigator.hardwareConcurrency <= 4`.
  - `tierSettings(tier)` returns the table from the spec: dprCap, rtMax,
    rtScale, lutW, pointsPerGalaxy, bhSteps, blurTaps, highDefine and
    fineFilaments.
- [ ] **Step 3: `resources.ts`.**
  - `createResources(gl, tier, scene)` compiles every program and builds the
    triangle and quad VAOs, the galaxy, web and project-star VAOs, the
    nebula cube map (`PROTO:835-858`) and the LUT target with MRT
    (`PROTO:859-870`).
  - `resize(res, bufW, bufH)` rebuilds `hdr`, the destination target and the
    bloom chain (`PROTO:1033-1053`).
  - `dispose(res)` frees everything.
  - `BH` step count comes through a define: `#define BH_STEPS 280/160`.
- [ ] **Step 4: `renderAtlas.ts`.** Port `renderAtlas`, `bhRect` and
  `bhCoverage` (`PROTO:1115-1170`). Additions:
  - Galaxy dim uniforms.
  - A project-star pass (additive, keep alpha) that runs only when
    `entered >= 0`, dims the other galaxies to 0.25, and passes `uHover` and
    `uVisible`.
  - A hover orbit ring: 96 web-style points around the galaxy center in its
    plane at the hovered star's radius, uploaded to a small dynamic VBO.
- [ ] **Step 5: `post.ts`.** Port `bloomPass` and `composite`
  (`PROTO:1190-1221`). Zoom-blur taps come from tier settings, through a
  define.
- [ ] **Step 6:** Run `npm run type-check`. Expected: exit 0.
- [ ] **Step 7:** Commit: `feat(cosmos): add the GL core, resources and Atlas render passes`.

### Task 10: Store, stage, input

**Files:** Create `src/components/cosmos/cosmosStore.ts`, `src/components/cosmos/engine/input.ts`, `src/components/cosmos/engine/stage.ts`.

- [ ] **Step 1: `cosmosStore.ts`.**
  - State:
    `{ support: 'unknown'|'ok'|'unsupported'|'lost'; mode: 'off'|'idle'|'journey'|'atlas'; journeyT: number; hudVisible: boolean; entered: string|null; hover: { kind: 'core'|'domain'|'work'|'fiction'; id: string } | null; panelOpen: boolean; viaJourney: boolean }`.
  - Exports: `getCosmos()`, `setCosmos(patch)`, `subscribeCosmos(fn)`, and
    `useCosmos(selector)` built on `useSyncExternalStore` with a server
    snapshot of the initial state.
  - Events: `onCosmosPick(fn)` gets `{ kind, id }` for clicks.
- [ ] **Step 2: `input.ts`.**
  - `attachAtlasInput(canvas, handlers)` ports the pointer, pinch, wheel,
    double-click, double-tap and key handling (`PROTO:1493-1572`).
  - Its outputs are callbacks: `onOrbitDrag(dx, dy, dt)`,
    `onZoom(ndc, k, rate)`, `onTap(x, y, touch)`, `onDoubleTap(x, y)`,
    `onHover(x, y)`, `onKey(key)`.
  - Clicks with more than 6px of movement are drags.
  - Keys are ignored while an input, textarea or contenteditable element has
    focus.
- [ ] **Step 3: `stage.ts`.**
  - `createStage(canvas, { topology, onSupport })` returns a `Stage` with:
    `setPath(path)`, `setModelTopology(topo)`, `enterAtlas({ viaJourney })`,
    `enterDomain(id)`, `exitDomain()`, `focusCore()`, `resetView()`,
    `setPanelOpen(b)`, `registerLabels(map)`, `registerPreview(el)`,
    `startJourney(opts)` (implemented in M2), `skipJourney()` and
    `dispose()`.
  - Modes follow the spec:
    - `idle`: init in `requestIdleCallback` with a 1500ms timeout. Warm by
      rendering the destination once, then stop the loop.
    - `atlas`: runs the loop, `stepOrbit`, `renderAtlas`, post, label
      writing and adaptive resolution (`PROTO:1437-1446`).
    - `off`: release after 10s.
  - Visibility pause. `dt` clamps at 0.05.
  - Picking on tap:
    - The core opens About: emit a `core` pick.
    - A galaxy calls `enterDomain(id)` (fly-to at distance 0.3 with rate 3.2,
      dim others) and emits a `domain` pick.
    - A project star emits `work`, and the fiction knot emits `fiction`.
    - Empty space exits the domain when one is entered.
  - Double-tap on the core flies to the close-up (distance 0.24).
    Double-tap on empty space zooms in 1.8x.
  - Hover sets the store's `hover`, the canvas cursor and the preview card
    position.
  - `window.__cosmos` debug hook, per the conventions.
- [ ] **Step 4:** Run `npm run type-check && npm test`. Expected: pass.
- [ ] **Step 5:** Commit: `feat(cosmos): add the stage, store and Atlas input`.

### Task 11: CosmosStage, topology query, layout

**Files:** Create `src/components/cosmos/CosmosStage.tsx`, `src/components/cosmos/useAtlasTopology.ts`, `src/components/cosmos/cosmos.css`. Modify `src/components/layout.tsx`.

- [ ] **Step 1: `useAtlasTopology.ts`.**
  - A `useStaticQuery` over `allProject` (name, cluster, status, medium,
    imgSrc, disabled), plus `allWriting { nodes { title } }`, plus
    `allMarkdownRemark(filter: {fields: {sourceInstanceName: {eq: "changelog"}}}, sort: {frontmatter: {date: DESC}}) { nodes { frontmatter { title type status date } } }`.
  - The result goes through `buildAtlasModel` with a null media resolver,
    then maps to `SceneTopology`.
- [ ] **Step 2: `CosmosStage.tsx`.**
  - Renders `<canvas className="cosmos-stage" aria-hidden="true" />` only
    after mount, so it is SSR-safe.
  - Creates the stage once, calls `stage.setPath(path)` on path change and
    feeds the topology.
  - Exposes the stage via a module singleton `cosmos` (`getStage()`) for
    pages.
- [ ] **Step 3: `cosmos.css`.**
  - `.cosmos-stage`: fixed, inset 0, z-index 0, `pointer-events: none`
    unless `[data-cosmos-mode="atlas"]`.
  - `html[data-cosmos-mode="journey"] .cosmos-stage` gets z-index 10000.
  - `html[data-cosmos-mode="journey"] .layout-container > :not(.cosmos-stage)`
    gets `visibility: hidden`.
  - `.atlas-chrome-fade`: opacity transition 0.6s.
  - `prefers-reduced-motion`: no transitions.
- [ ] **Step 4: `layout.tsx`.**
  - Render `<CosmosStage path={pagePath} />` as the first child of
    `.layout-container` in both return branches.
  - Atlas branch: wrap Header and SideBar so their opacity follows
    `useCosmos(s => s.hudVisible)`.
- [ ] **Step 5:** Run `npm run type-check && npm run build`. Expected: pass,
  with no SSR errors.
- [ ] **Step 6:** Commit: `feat(cosmos): mount the persistent cosmos stage in the layout`.

### Task 12: HUD extraction

**Files:** Create `src/components/atlas/AtlasHud.tsx`, `src/components/atlas/AtlasTerminal.tsx`. Modify `src/components/atlas/AtlasCanvas.tsx`, `test/atlas-project-rail.test.mjs`.

- [ ] **Step 1: Update the rail test first.**
  - Assert that `AtlasHud.tsx` contains `import { ProjectRail } from "./ProjectRail"`,
    `<ProjectRail`, `domains={domains}` and `hidden={hidden}`, where
    `hidden` is computed from `entered` and `panel`.
  - Assert that `AtlasCanvas.tsx` contains `<AtlasHud`.
  - Run it. Expected: FAIL.
- [ ] **Step 2:** Move `AtlasTerminal` (`AtlasCanvas.tsx:1411-1538`) into
  `AtlasTerminal.tsx` without changes.
- [ ] **Step 3:** Move the JSX overlay (`AtlasCanvas.tsx:1259-1406`) into
  `AtlasHud` with these props:
  `{ domains, fiction, essays, changelog, entered: boolean, panel, setPanel, term, setTerm, onResetGalaxy, hints?: string }`.
  Remove the gizmo. `AtlasCanvas` renders `<canvas>` plus `<AtlasHud … />`
  and keeps all its state.
- [ ] **Step 4:** Run `npm test && npm run type-check`. Expected: pass. The
  legacy Atlas looks identical, minus the gizmo: verify later in Task 15's
  captures with `?atlas-legacy`.
- [ ] **Step 5:** Commit: `refactor(atlas): extract the shared Atlas HUD and terminal`.

### Task 13: CosmosAtlas view

**Files:** Create `src/components/atlas/CosmosAtlas.tsx`, `AtlasLabels.tsx`, `AtlasPreviewCard.tsx`, `AtlasA11yNav.tsx`. Modify `src/pages/atlas.tsx`.

- [ ] **Step 1:** `atlas.tsx` renders `<AtlasCanvas …/>` when
  `useCosmos(s => s.support)` is `unsupported` or `lost`, or when the URL has
  `atlas-legacy`. Otherwise it renders `<CosmosAtlas model={model} />`.
- [ ] **Step 2: `CosmosAtlas`.**
  - Own `panel`, `term` and `entered` (mirrored from the store).
  - On mount: `stage.enterAtlas({ viaJourney: location.state?.viaJourney })`.
  - Subscribe to picks:
    - `core` opens `setPanel({type:'about'})`.
    - `work` resolves the id to `{work, domain}` from the full model and opens
      the project panel.
    - `fiction` opens `setPanel({type:'fiction'})`.
  - `setPanel` informs `stage.setPanelOpen`.
  - Esc layering: close the panel first, else `stage.exitDomain()`.
  - Render `AtlasHud` with the updated hints, `onResetGalaxy` set to
    `stage.exitDomain`, and `hidden` until `hudVisible`.
- [ ] **Step 3: `AtlasLabels`.**
  - One node per domain, one for the core, and one per work in the entered
    domain, keyed by id, with the `.lbl` and `.lead` styles from
    `PROTO:9-27`.
  - It registers refs with `stage.registerLabels`. The stage writes the
    transforms and toggles visibility.
- [ ] **Step 4: `AtlasPreviewCard`.**
  - Shows when `hover.kind === 'work'`, with media via `isVideo` (the video
    autoplays muted) plus title, medium and status.
  - The stage writes its position, clamped away from the cursor.
- [ ] **Step 5: `AtlasA11yNav`.**
  - A visually hidden `<nav aria-label="Atlas">` that becomes visible on
    focus. It lists the core, the domains, and the works of the entered
    domain as buttons.
  - Each button calls the same stage and panel actions as a click.
  - After arrival, focus moves to the heading `<h1 class="sr-only">Atlas</h1>`.
- [ ] **Step 6:** Run `npm run type-check && npm test && npm run build`.
  Expected: pass.
- [ ] **Step 7:** Commit: `feat(atlas): add the WebGL Atlas view with labels, preview and accessible nav`.

### Task 14: Capture harness

**Files:** Create `scripts/cosmos-capture.mjs`.

- [ ] **Step 1:** Port the scratchpad CDP driver.
  - Scenarios: `atlas` (arrival frame), `atlas-enter <domain>`, `closeup`,
    `perf` (fps for the Atlas and the close-up), `journey` (frames at the
    given times through `__cosmos.goto`, M2), `longtasks` (M2), and `audio`
    (M2).
  - Flags: `--dpr`, `--size WxH`, `--out`.
  - It targets `npx gatsby serve` or `develop` on a given port. It launches
    system Chrome with `--headless=new --enable-unsafe-swiftshader`.
- [ ] **Step 2:** Run `node scripts/cosmos-capture.mjs --help`. Expected:
  usage text.
- [ ] **Step 3:** Commit: `chore(cosmos): add the headless capture harness`.

### Task 15: M1 verification and review

- [ ] **Step 1:** Run `npm run type-check && npm test && npm run build`.
  Expected: all pass.
- [ ] **Step 2:** Run `npx gatsby serve -p 9123`, then the harness:
  - `atlas` at 1440x900 with DPR 1 and 2, and at 390x844 with DPR 3.
  - `atlas-enter obsidian`, `atlas-enter writing`, `closeup`, `perf` at DPR 2,
    and `?atlas-legacy`.

  Compare against `docs/superpowers/specs/assets/2026-09-26-atlas-arrival.jpg`
  and the close-up image.

  Expected:
  - Labels are readable.
  - Galaxies, stars and the black hole match the prototype.
  - 60fps in the Atlas at DPR 2. The close-up holds 60fps after adaptation.
- [ ] **Step 3:** Run the combined review through the router (reviewer, author
  `claude`) on `git diff 42fa901..HEAD`. The prompt covers spec compliance
  for M1, correctness, SSR safety, leaks, and test quality.
- [ ] **Step 4:** Fix the material findings, re-run the checks, and commit
  `fix(cosmos): address M1 review`.

## Milestone 2: The journey

### Task 16: Journey timeline

**Files:** Create `src/components/cosmos/engine/journeyTimeline.ts`, `test/cosmos-journey-timeline.test.ts`.

- [ ] **Step 1: Failing test.**
  - `journeyParams` is continuous (|Δ| < 1e-3 across t ± 1e-4) at `J.open1`,
    `J.cross` and `J.switch` for `l`, the camera `F`, `fovK` and `back`.
  - `lensOn` is false before `J.open0`.
  - `fade` is 0 at `J.switch`.
  - `speed=1.45` scales all times.
  - At the switch, camera `F` equals the journey `Z` and roll is 0.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.** Port `params()` (`PROTO:1054-1104`) and
  `computeFrames` (`PROTO:1020-1032`) as pure functions:
  - `journeyFrames({ viewport, ctaCenter })` returns
    `{ HOME, JF, RT_TAN, ARR_K }`.
  - `journeyParams(t, frames, speed)` returns `JourneyParams`.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(cosmos): port the journey timeline`.

### Task 17: Journey render and stage mode

**Files:** Create `src/components/cosmos/engine/renderJourney.ts`. Modify `src/components/cosmos/engine/stage.ts`.

- [ ] **Step 1:** Port `updateLut` and `lensPass` (`PROTO:871-893`,
  `PROTO:1171-1189`) into `renderJourney.ts`.
- [ ] **Step 2: Stage `startJourney({ snapshot, ctaCenter, speed })`.**
  - Upload the snapshot as the page texture (mipmapped plus anisotropic,
    `PROTO:969-1019`).
  - Build the frames, then set `data-cosmos-mode="journey"` on `<html>`.
  - Each frame: `renderAtlas` (without sky) into the destination, then the
    LUT, the lens, bloom and the composite.
  - At `J.switch / speed`, call `onHandoff()`, switch to atlas mode (orbit
    reset hard, `back` continuing from `journeyParams`) and set
    `hudVisible` after 0.1s.
  - `skipJourney()` jumps t to `J.switch / speed`.
- [ ] **Step 3:** Run `npm run type-check`. Expected: pass.
- [ ] **Step 4:** Commit: `feat(cosmos): render the wormhole journey on the stage`.

### Task 18: Particle capture

**Files:** Create `src/components/cosmos/particleCapture.ts`. Modify `src/components/nebula/ParticleBackground.tsx`.

- [ ] **Step 1: `particleCapture.ts`.**
  - `registerParticleCanvas(getCanvas)` and
    `captureParticles(ctx, w, h): Promise<boolean>`.
  - The capture registers a one-shot `addAfterEffect` callback that draws the
    registered canvas into `ctx` and resolves `true`. It resolves `false`
    when nothing is registered or after 120ms.
- [ ] **Step 2:** In `ParticleBackground`, inside a small child component,
  call `registerParticleCanvas(() => gl.domElement)` from
  `useThree(s => s.gl)` and unregister on unmount.
- [ ] **Step 3:** Run `npm run type-check`. Expected: pass.
- [ ] **Step 4:** Commit: `feat(cosmos): capture the home particle frame for the hand-off`.

### Task 19: Home snapshot rasterizer

**Files:** Create `src/components/cosmos/homeSnapshot.ts`.

- [ ] **Step 1:** Implement `snapshotHome(canvas, dpr): Promise<void>`.
  1. Fill `#111`.
  2. `await captureParticles`.
  3. Rasterize the roots in stacking order. Roots are the elements marked
     `data-cosmos-snapshot="<z>"`: header `10`, `.hometex` `2`, the
     DomArtifacts root `45`, the terminal root `50`, the audio toggle `60`.
  4. For each visible element, walking the subtree in DOM order:
     - Draw the box: background color, border, border-radius, and an
       approximate `box-shadow` through canvas shadow. The opacity is the
       product of the ancestors' opacities.
     - Draw each text node per character, using a `Range` rect for each
       character with the computed font, color and `letterSpacing`.
       Baseline = `rect.top + (rect.height - (ascent + descent)) / 2 + ascent`
       from `measureText`.
     - Draw `<img>`, `<video>` and `<canvas>` with `drawImage`, honoring
       `object-fit`.
     - Draw inline `<svg>` by walking `path`, `circle`, `rect`, `line`,
       `polyline` and `g`, using Path2D mapped from the viewBox to the
       element rect, with fill and stroke resolved (`currentColor` becomes
       the computed color).
     - Skip elements with `display: none`, `visibility: hidden` or
       `opacity: 0`, and skip the `.cosmos-stage` canvas and the custom
       cursor.
  5. Pause the glitch animation: add `data-cosmos-snap` to `<html>`, which
     disables `.glitch-text` animations and pseudo-elements, then remove it
     after the capture.
- [ ] **Step 2:** Add the `data-cosmos-snapshot` attributes to the roots in
  `header.tsx`, `index.tsx`, `DomArtifacts.tsx`, `TerminalConsole.tsx` and
  `layout.tsx` (`AudioToggle`).
- [ ] **Step 3:** Run `npm run type-check`. Expected: pass.
- [ ] **Step 4:** Commit: `feat(cosmos): rasterize the live home page for the wormhole hand-off`.

### Task 20: Wire the CTA and the hand-off

**Files:** Modify `src/pages/index.tsx`, `src/pages/atlas.tsx`. Delete `src/components/atlas/AtlasDive.tsx`.

- [ ] **Step 1: CTA.**
  - On home mount, schedule
    `requestIdleCallback(() => prefetchPathname("/atlas/"))`.
  - On click:
    - Unsupported: `navigate("/atlas/")`.
    - Reduced motion: fade `.hometex` over 0.35s, then `navigate`. The stage
      enters atlas mode when the page mounts.
    - Otherwise: build the snapshot, then
      `stage.startJourney({ snapshot, ctaCenter, speed })`. The speed is 1 on
      the first journey this session and 1.45 afterward (sessionStorage
      `cosmos-journeys`). The `onHandoff` is
      `navigate("/atlas/", { state: { viaJourney: true } })`.
  - Remove `AtlasDive` and the `diving` state.
- [ ] **Step 2:** `atlas.tsx`: when `location.state?.viaJourney` is set, skip
  `usePageTransition`'s mount fade for the HUD, because the stage drives
  `hudVisible`.
- [ ] **Step 3:** Delete `AtlasDive.tsx`. Run
  `npm run type-check && npm test && npm run build`. Expected: pass.
- [ ] **Step 4:** Commit: `feat(cosmos): launch the wormhole journey from the home CTA`.

### Task 21: Journey audio

**Files:** Create `src/components/cosmos/engine/journeyAudio.ts`. Modify `src/pages/index.tsx` (or the stage), so audio starts with the journey.

- [ ] **Step 1:** Port `playJourney` (`PROTO:1284-1320`) as
  `playJourneyScore(ctx, speed): () => void`.
- [ ] **Step 2:** Start it only when `useAmbientAudio()` reports unmuted and
  `engine.getContext()` is non-null. Stop it on skip or hand-off plus 4s.
- [ ] **Step 3:** Run `npm run type-check`. Expected: pass.
- [ ] **Step 4:** Commit: `feat(cosmos): add the synthesized journey score`.

### Task 22: M2 verification and review

- [ ] **Step 1:** Run `npm run type-check && npm test && npm run build`.
- [ ] **Step 2:** Serve the build and run the harness:
  - `journey` frames at t = 0, 0.3, 1.0, 1.6, 2.05, 2.25, 2.5 and 3.8 at
    1440x900, DPR 1 and 2, and at 390x844. Compare against the storyboard.
  - `longtasks` across the journey. Expected: no task over 50ms after the
    click.
  - `audio` counters: muted means zero nodes; unmuted means the score graph,
    with no `whoosh`.
  - Back navigation: Atlas to Home restores the home page and particles.
- [ ] **Step 3:** Run the combined review through the router on the M2 diff.
  Fix material findings and commit `fix(cosmos): address M2 review`.

## Milestone 3: Hardening and launch prep

### Task 23: Tiers, context loss, visibility

- [ ] **Step 1:** Apply `tierSettings` everywhere: DPR cap, destination size,
  LUT width, points, black-hole steps, blur taps, defines.
- [ ] **Step 2:** Context loss:
  - Stop the loop and set the store's support to `lost`.
  - During a journey, jump straight to `navigate("/atlas/")`.
  - `atlas.tsx` shows the legacy `AtlasCanvas` while support is `lost`.
  - On restore, rebuild resources and return to `ok`.
- [ ] **Step 3:** Verify with the harness. Use `WEBGL_lose_context` through
  the debug hook in both modes. Use `--size 390x844 --dpr 3` for the
  balanced tier, and check the fps probes.
- [ ] **Step 4:** Commit: `feat(cosmos): quality tiers and context-loss recovery`.

### Task 24: Docs and cleanup

- [ ] **Step 1:** In `CLAUDE.md`:
  - Add a Cosmos stage section covering the architecture, the modes, the
    debug hook, the harness and the test lane.
  - Update the Commands section with `npm run test:cosmos`.
- [ ] **Step 2:** Remove the scratch smoke test if it still exists. Confirm
  no `AtlasDive` references remain (`grep -r AtlasDive src`).
- [ ] **Step 3:** Commit: `docs: document the cosmos stage`.

### Task 25: Final verification and hand-off

- [ ] **Step 1:** Run `npm run type-check && npm test && npm run build`.
- [ ] **Step 2:** Run the full harness pass (Atlas, entered, close-up,
  journey, perf, longtasks, audio) at desktop DPR 2 and phone sizes. Save the
  contact sheets to the scratchpad and list them in the report.
- [ ] **Step 3:** Run the final combined review of `42fa901..HEAD` through the
  router. Fix material findings.
- [ ] **Step 4:** Hand off to Nic. Give him the local test commands and the
  branch name. The checklist for him covers his phone, Safari and sound on.
  Leave the branch unmerged and undeployed until he approves.
