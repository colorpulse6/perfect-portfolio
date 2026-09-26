/**
 * The cosmos stage: one WebGL2 canvas that lives in the persistent layout.
 *
 * Modes
 *   off      any route other than "/" and "/atlas": no loop; the context is
 *            released after a quiet period.
 *   idle     "/" before the click: the context, programs, scene and targets
 *            are prepared in idle time, then the stage waits without a loop.
 *   journey  the wormhole from the home CTA into the Atlas (see journey code).
 *   atlas    "/atlas": the interactive galaxy map behind the React HUD.
 *
 * The stage talks to React only through the cosmos store (coarse state and
 * pick events). Per-frame label and preview positions are written straight
 * to registered DOM nodes.
 */
import { createGL, enableCaps } from "./gl"
import type { GL, GLCaps } from "./gl"
import { detectTier, tierSettings } from "./quality"
import type { TierSettings } from "./quality"
import { createProgramCompiler, createResources, ensureTargets, atlasTarget, disposeResources, uploadScene } from "./resources"
import type { Resources, Programs } from "./resources"
import { buildAtlasScene, starPosition, MAX_GALAXIES } from "./atlasScene"
import type { AtlasSceneData, SceneTopology, SceneStar } from "./atlasScene"
import { renderAtlas, bhCoverage, setHoverRing } from "./renderAtlas"
import { bloomPass, composite, ATLAS_COMPOSITE } from "./post"
import { createOrbit, orbitCamera, stepOrbit, dragOrbit, releaseDrag, zoomAt, flyTo, resetOrbit, ORBIT_DEFAULTS } from "./orbitCamera"
import type { OrbitConfig, OrbitState } from "./orbitCamera"
import { dot, sub, mul } from "./vec3"
import type { CamBasis, Vec3 } from "./vec3"
import { attachAtlasInput } from "./input"
import type { AtlasKey } from "./input"
import { pick } from "./picking"
import type { PickTarget } from "./picking"
import { placeLabel, placeCoreLabel, layoutLabels, LABEL_ANGLES, LABEL_SAFE } from "./labels"
import type { LayoutItem, LabelPlacement, Rect } from "./labels"
import { J, journeyFrames, journeyParams } from "./journeyTimeline"
import type { JourneyFrames } from "./journeyTimeline"
import { createLutState, lensPass, updateLut, uploadPage } from "./renderJourney"
import type { LutState } from "./renderJourney"
import { setCosmos, emitCosmosPick } from "../cosmosStore"
import type { CosmosMode } from "../cosmosStore"

export interface LabelNode {
  label: HTMLElement
  lead?: HTMLElement | null
}

export interface LabelNodes {
  core: HTMLElement | null
  domains: Map<string, LabelNode>
  works: Map<string, LabelNode>
}

export interface JourneyStart {
  /** The home page at the click, and the same page without the call to action. */
  snapshot: { page: TexImageSource; pageNoCta: TexImageSource }
  /** Center of the call to action, in CSS pixels. */
  ctaCenter: { x: number; y: number }
  /** 1 on the first journey of a session; above 1 plays it faster. */
  speed: number
  /** Called once at the hand-off (J.switch / speed): navigate to /atlas here. */
  onHandoff: () => void
  /** Called when the visitor skips to the hand-off (the score stops early). */
  onSkip?: () => void
  /** Called when the journey stops early: another route, a failure, dispose. */
  onAbort?: () => void
}

export interface Stage {
  setPath(path: string): void
  setTopology(topo: SceneTopology): void
  enterDomain(id: string): void
  exitDomain(): void
  focusCore(): void
  resetView(): void
  setPanelOpen(open: boolean): void
  /**
   * Does what clicking this object in the scene does: enter a galaxy, open
   * the About panel from the core, open a project or the fiction. Labels and
   * the preview card call it.
   */
  activate(target: { kind: PickTarget["kind"]; id: string }): void
  /** While held (the pointer is on the preview card) the hover stays put. */
  holdHover(on: boolean): void
  /** Returns an unregister function that only clears this registration. */
  registerLabels(nodes: LabelNodes): () => void
  /** Returns an unregister function that only clears this registration. */
  registerPreview(el: HTMLElement): () => void
  /** Pixel ratio for the home snapshot: the device's, capped by the quality tier. */
  pageScale(): number
  /** Resolves false when the journey cannot run (unsupported or not ready). */
  startJourney(opts: JourneyStart): Promise<boolean>
  skipJourney(): void
  dispose(): void
}

type Proj = { x: number; y: number; z: number }

const DEG = Math.PI / 180
/** How long an empty-space tap waits for a possible double-click. */
const DOUBLE_TAP_MS = 320
/** How long a star's preview outlives the pointer, so the card can be reached. */
const HOVER_GRACE_MS = 280
/** HUD elements that galaxy labels steer around. */
const LABEL_AVOID = "[data-cosmos-avoid], .atlas-rail, header .header-container > :first-child > *, header button"
const isAtlasPath = (p: string) => /^\/atlas\/?$/.test(p)
const isHomePath = (p: string) => p === "/" || p === ""
const easeOutCubic = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

function requestIdle(cb: () => void): number {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
  return w.requestIdleCallback ? w.requestIdleCallback(cb, { timeout: 1500 }) : window.setTimeout(cb, 120)
}
function cancelIdle(h: number) {
  const w = window as Window & { cancelIdleCallback?: (h: number) => void }
  if (w.cancelIdleCallback) w.cancelIdleCallback(h)
  else window.clearTimeout(h)
}

export function createStage(canvas: HTMLCanvasElement): Stage {
  const reduceMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const settings: TierSettings = tierSettings(detectTier())
  const debug = /cosmos-debug/.test(window.location.search)

  let mode: CosmosMode = "off"
  let gl: GL | null = null
  let caps: GLCaps | null = null
  let compiler: ReturnType<typeof createProgramCompiler> | null = null
  let programs: Programs | null = null
  let res: Resources | null = null
  let topology: SceneTopology | null = null
  let scene: AtlasSceneData | null = null
  let sceneDirty = false
  let failed = false
  /** The context is lost and not yet restored. */
  let lost = false
  /** The last route given to setPath. */
  let path = ""

  let raf = 0
  let lastMs = 0
  const time0 = performance.now()
  let cssW = 0
  let cssH = 0
  let bufW = 0
  let bufH = 0
  let tanX = 1
  let tanY = 1
  let arrK = 1

  let orbit: OrbitState | null = null
  let orbitCfg: OrbitConfig | null = null
  let dragging = false
  let atlasT = 0
  let introBack = 0
  let entered = -1
  let reveal = 0
  const galDim = new Float32Array(MAX_GALAXIES).fill(1)
  let webDim = 1
  let hover: PickTarget | null = null
  let hoverStarIdx = -1
  let panelOpen = false
  let atlasScale = 1
  let ftAvg = 16.7
  let ftN = 0
  let lastCam: CamBasis | null = null
  let lastT = 0
  let frames = 0

  let labels: LabelNodes | null = null
  const labelSize = new WeakMap<HTMLElement, [number, number]>()
  const labelPrev = new Map<string, number>()
  const labelAngle = new Map<string, number>()
  let obstacles: Rect[] = []
  let obstaclesFrame = -1e9
  let preview: HTMLElement | null = null
  let detachInput: (() => void) | null = null
  let idleHandle = 0
  let releaseTimer = 0
  let exitTimer = 0
  let hudTimer = 0
  /** The pointer is on the preview card: canvas hover changes wait. */
  let hoverHeld = false
  let hoverGrace = 0

  interface Journey {
    frames: JourneyFrames
    speed: number
    /** performance.now() at the first journey frame. */
    start: number
    lut: LutState
    /** Cleared once called. */
    onHandoff: (() => void) | null
    onSkip: (() => void) | null
    onAbort: (() => void) | null
    /** Wall-clock seconds of the hand-off and of the settled arrival. */
    switchAt: number
    endAt: number
    /** Debug only (__cosmos.goto): hold the journey at this time. */
    frozenT: number | null
  }
  /** The running journey; after the hand-off it lingers until endAt to drive `back`. */
  let journey: Journey | null = null
  let detachJourneyInput: (() => void) | null = null
  const journeyTime = (j: Journey, ms: number) => j.frozenT ?? (ms - j.start) / 1000
  let coreTimer = 0

  const setMode = (m: CosmosMode) => {
    mode = m
    document.documentElement.setAttribute("data-cosmos-mode", m)
    setCosmos({ mode: m })
  }

  // ── Context, programs, scene, resources ─────────────────────────────
  const markUnsupported = (why: string) => {
    failed = true
    console.warn(`[cosmos] ${why}; using the classic Atlas.`)
    setCosmos({ support: "unsupported" })
    stopLoop()
    setMode("off")
  }

  function ensureContext(): boolean {
    if (failed || lost) return false
    if (gl) return !gl.isContextLost()
    const r = createGL(canvas)
    if ("error" in r) {
      markUnsupported(r.error)
      return false
    }
    gl = r.gl
    caps = r.caps
    canvas.addEventListener("webglcontextlost", onContextLost, false)
    canvas.addEventListener("webglcontextrestored", onContextRestored, false)
    setCosmos({ support: "ok" })
    return true
  }

  /** Advance compilation; `blocking` finishes everything now. */
  function ensurePrograms(blocking: boolean): boolean {
    if (programs) return true
    if (!gl || !caps) return false
    try {
      if (!compiler) compiler = createProgramCompiler(gl, caps, settings)
      if (blocking) programs = compiler.finishAll()
      else if (compiler.step()) programs = compiler.programs()
    } catch (e) {
      markUnsupported(`A shader failed to compile (${(e as Error).message.split("\n")[0]})`)
      return false
    }
    return !!programs
  }

  function ensureScene(): boolean {
    if (!topology) return false
    if (!scene || sceneDirty) {
      try {
        scene = buildAtlasScene(topology, { pointsPerGalaxy: settings.pointsPerGalaxy })
        sceneDirty = false
        if (res) uploadScene(res, scene)
      } catch (e) {
        markUnsupported(`The Atlas scene could not be built (${(e as Error).message})`)
        return false
      }
    }
    return true
  }

  function ensureResources(blocking: boolean): boolean {
    if (res) return ensureScene()
    if (!ensureContext() || !ensurePrograms(blocking) || !ensureScene()) return false
    try {
      res = createResources(gl!, caps!, settings, programs!, scene!)
      resize(true)
    } catch (e) {
      if (res) disposeResources(res)
      res = null
      markUnsupported(`GPU resources could not be created (${(e as Error).message})`)
      return false
    }
    return true
  }

  // A lost context takes every GPU object with it. Stop, hide the canvas and
  // let the page fall back to the classic Atlas; preventDefault asks the
  // browser to restore the context later.
  function onContextLost(e: Event) {
    e.preventDefault()
    lost = true
    const handoffNow = failJourney()
    stopLoop()
    detach()
    if (idleHandle) cancelIdle(idleHandle)
    idleHandle = 0
    window.clearTimeout(releaseTimer)
    res = null
    programs = null
    compiler = null
    orbit = null
    setMode("off")
    setCosmos({ support: "lost" })
    // Mid-journey, still go to the Atlas: the page shows the classic one.
    handoffNow?.()
  }
  // The Atlas page keeps the classic view until the next visit, so only the
  // home warm-up resumes here; setPath picks the rest up on the next route.
  function onContextRestored() {
    lost = false
    const restored = gl ? enableCaps(gl) : { error: "no context" }
    if ("error" in restored) {
      markUnsupported(`The restored context is missing features (${restored.error})`)
      return
    }
    caps = restored
    setCosmos({ support: "ok" })
    if (isHomePath(path) && !failed) {
      setMode("idle")
      idleHandle = requestIdle(idleWarmup)
    }
  }

  // ── Sizing and camera configuration ─────────────────────────────────
  function resize(force = false) {
    const w = Math.max(1, window.innerWidth)
    const h = Math.max(1, window.innerHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, settings.dprCap)
    const bw = Math.round(w * dpr)
    const bh = Math.round(h * dpr)
    if (!force && bw === bufW && bh === bufH && w === cssW && h === cssH) return
    cssW = w
    cssH = h
    bufW = bw
    bufH = bh
    canvas.width = bw
    canvas.height = bh
    const base = Math.tan(27.5 * DEG)
    tanY = w >= h ? base : (base * h) / w
    tanX = (tanY * w) / h
    arrK = w < h ? 1.22 : 1
    if (scene) {
      const cfg: OrbitConfig = { ...ORBIT_DEFAULTS, target0: scene.target0, basePos: mul(scene.arrival.pos, arrK) }
      orbitCfg = cfg
      if (!orbit) orbit = createOrbit(cfg)
    }
    if (res) ensureTargets(res, bufW, bufH)
    measureLabels()
    obstaclesFrame = -1e9
  }

  // ── Loop ─────────────────────────────────────────────────────────────
  function startLoop() {
    if (raf) return
    lastMs = performance.now()
    raf = requestAnimationFrame(frame)
  }
  function stopLoop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  function frame(ms: number) {
    raf = 0
    if (!res || !scene) return
    const dt = Math.min(0.05, Math.max(0, (ms - lastMs) / 1000))
    lastMs = ms
    const t = ((ms - time0) / 1000) * (reduceMotion ? 0.25 : 1)
    try {
      resize()
      if (mode === "journey" && journey && journeyTime(journey, ms) < journey.switchAt) journeyFrame(journeyTime(journey, ms), t)
      else if (mode === "journey" || mode === "atlas") {
        if (journey?.onHandoff) handOff()
        atlasFrame(dt, t, ms)
      }
    } catch (e) {
      detach()
      const handoffNow = failJourney()
      markUnsupported(`The Atlas stopped rendering (${(e as Error).message})`)
      handoffNow?.()
      return
    }
    frames++
    if (mode === "atlas" || mode === "journey") raf = requestAnimationFrame(frame)
  }

  function atlasFrame(dt: number, t: number, ms: number) {
    if (!res || !scene || !orbit || !orbitCfg) return
    atlasT += dt
    const k = 1 - Math.exp(-dt * 5)
    reveal += ((entered >= 0 ? 1 : 0) - reveal) * k
    for (let i = 0; i < galDim.length; i++) {
      const target = entered < 0 || i === entered ? 1 : 0.25
      galDim[i] += (target - galDim[i]) * k
    }
    webDim += ((entered >= 0 ? 0.35 : 1) - webDim) * k
    if (reduceMotion) {
      orbit.vAz = 0
      orbit.vEl = 0
    }
    stepOrbit(orbit, dt, { dragging, autoDrift: !reduceMotion && !panelOpen && entered < 0, now: ms })
    let back = reduceMotion ? 0 : introBack * (1 - easeOutCubic(atlasT / 1.8))
    if (journey) {
      // Right after the hand-off the camera keeps the journey's dolly and overshoot.
      const jt = journeyTime(journey, ms)
      back = journeyParams(jt, journey.frames, journey.speed).back
      if (jt >= journey.endAt) journey = null
    }
    const cam = orbitCamera(orbit, orbitCfg, back)

    // Adaptive resolution: trade sharpness for smoothness when the GPU falls behind.
    ftAvg = ftAvg * 0.9 + dt * 1000 * 0.1
    ftN++
    const heavy = bhCoverage(scene, cam, tanX, tanY) > 0.55
    if (!heavy && atlasScale < 1) {
      atlasScale = 1
      ftN = 0
      ftAvg = 16.7
    } else if (ftN > 45 && ftAvg > 19.5 && atlasScale > 0.5) {
      atlasScale = Math.max(0.5, atlasScale - 0.1)
      ftN = 0
      ftAvg = 16.7
    } else if (ftN > 180 && ftAvg < 17.4 && atlasScale < 1) {
      atlasScale = Math.min(1, atlasScale + 0.1)
      ftN = 0
      ftAvg = 16.7
    }
    const tgt = atlasTarget(res, atlasScale)
    renderAtlas(res, scene, tgt, {
      cam,
      tanX,
      tanY,
      time: t,
      withSky: true,
      entered,
      reveal,
      hoverStar: hoverStarIdx,
      galDim,
      webDim,
    })
    bloomPass(res, tgt)
    composite(res, tgt, t, ATLAS_COMPOSITE)
    lastCam = cam
    lastT = t
    placeLabels(cam, t, dt)
    placePreview(cam, t)
  }

  // ── Projection, picking, hover ───────────────────────────────────────
  function project(cam: CamBasis, p: Vec3): Proj | null {
    const q = sub(p, cam.pos)
    const z = dot(q, cam.F)
    if (z < 0.2) return null
    return {
      x: ((dot(q, cam.R) / z / tanX) * 0.5 + 0.5) * cssW,
      y: (0.5 - (dot(q, cam.U) / z / tanY) * 0.5) * cssH,
      z,
    }
  }
  const worldToPx = (worldR: number, z: number) => (worldR / z / tanY) * cssH * 0.5

  function starsOf(gi: number): SceneStar[] {
    if (!scene) return []
    const list = scene.stars.filter((s) => s.domain === gi)
    if (scene.fictionKnot && scene.fictionKnot.domain === gi) list.push(scene.fictionKnot)
    return list
  }
  const starIndex = (s: SceneStar) =>
    scene ? (s === scene.fictionKnot ? scene.stars.length : scene.stars.indexOf(s)) : -1

  function pickTargets(cam: CamBasis, t: number): PickTarget[] {
    if (!scene) return []
    const out: PickTarget[] = []
    const core = project(cam, scene.bh.pos)
    if (core) out.push({ kind: "core", id: "me", x: core.x, y: core.y, r: worldToPx(scene.bh.outer, core.z) * 0.85 })
    scene.galaxies.cPos.forEach((c, gi) => {
      const s = project(cam, c)
      if (s) out.push({ kind: "domain", id: scene!.domainIds[gi], x: s.x, y: s.y, r: Math.max(14, worldToPx(scene!.galaxies.sizes[gi], s.z) * 0.75) })
    })
    if (entered >= 0) {
      for (const st of starsOf(entered)) {
        const s = project(cam, starPosition(scene, st, t))
        if (s) out.push({ kind: st === scene.fictionKnot ? "fiction" : "work", id: st.id, x: s.x, y: s.y, r: st === scene.fictionKnot ? 20 : 12 })
      }
    }
    return out
  }

  function setHover(h: PickTarget | null) {
    const same = (h && hover && h.kind === hover.kind && h.id === hover.id) || (!h && !hover)
    hover = h
    canvas.style.cursor = h ? "pointer" : "grab"
    if (same) return
    let star: SceneStar | null = null
    if (h && scene && (h.kind === "work" || h.kind === "fiction")) {
      star = (h.kind === "fiction" ? scene.fictionKnot : scene.stars.find((s) => s.id === h.id)) || null
    }
    hoverStarIdx = star ? starIndex(star) : -1
    if (res && scene) setHoverRing(res, scene, star && h?.kind === "work" ? star : null)
    setCosmos({ hover: h ? { kind: h.kind, id: h.id } : null })
  }

  // ── Labels and preview ───────────────────────────────────────────────
  function measureLabels() {
    if (!labels) return
    const measure = (el: HTMLElement | null) => {
      if (el) labelSize.set(el, [el.offsetWidth, el.offsetHeight])
    }
    measure(labels.core)
    labels.domains.forEach((n) => measure(n.label))
    labels.works.forEach((n) => measure(n.label))
  }
  const sizeOf = (el: HTMLElement) => {
    let s = labelSize.get(el)
    if (!s || s[0] === 0) {
      s = [el.offsetWidth, el.offsetHeight]
      labelSize.set(el, s)
    }
    return s
  }
  const hide = (el: HTMLElement | null | undefined) => {
    if (el) el.style.visibility = "hidden"
  }
  function writeLabel(n: LabelNode, p: LabelPlacement, opacity: number) {
    n.label.style.visibility = opacity > 0.02 ? "visible" : "hidden"
    n.label.style.opacity = opacity.toFixed(3)
    n.label.style.textAlign = p.side === "right" ? "left" : "right"
    n.label.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`
    if (n.lead) {
      const dx = p.lineTo[0] - p.lineFrom[0]
      const dy = p.lineTo[1] - p.lineFrom[1]
      n.lead.style.visibility = n.label.style.visibility
      n.lead.style.opacity = opacity.toFixed(3)
      n.lead.style.width = `${Math.hypot(dx, dy).toFixed(1)}px`
      n.lead.style.transform = `translate(${p.lineFrom[0].toFixed(1)}px, ${p.lineFrom[1].toFixed(1)}px) rotate(${Math.atan2(dy, dx).toFixed(4)}rad)`
    }
  }
  function hideLabel(key: string, n: LabelNode) {
    hide(n.label)
    hide(n.lead)
    labelAngle.delete(key)
  }

  // HUD elements labels must not cover. Read at the start of a frame (before
  // this frame's style writes), at most every 30 frames or when the HUD changes.
  function refreshObstacles() {
    obstacles = []
    document.querySelectorAll<HTMLElement>(LABEL_AVOID).forEach((el) => {
      const b = el.getBoundingClientRect()
      if (b.width >= 1 && b.height >= 1) obstacles.push({ l: b.left - 8, t: b.top - 6, r: b.right + 8, b: b.bottom + 6 })
    })
    obstaclesFrame = frames
  }

  function placeLabels(cam: CamBasis, t: number, dt: number) {
    if (!labels || !scene) return
    if (frames - obstaclesFrame > 30) refreshObstacles()
    const viewport = { w: cssW, h: cssH }
    const onScreen = (s: Proj, m: number) => s.x > -m && s.x < cssW + m && s.y > -m && s.y < cssH + m
    const taken: Rect[] = []
    const core = project(cam, scene.bh.pos)
    const center = core ? { x: core.x, y: core.y } : { x: cssW / 2, y: cssH / 2 }
    if (labels.core) {
      // Off screen, a clamped core label would sit in a corner under the HUD.
      if (!core || !onScreen(core, 0)) hide(labels.core)
      else {
        const [w, h] = sizeOf(labels.core)
        const p = placeCoreLabel({
          center: core,
          diskPx: worldToPx(scene.bh.outer, core.z),
          labelW: w,
          labelH: h,
          viewport,
          narrow: cssW < 600,
        })
        taken.push({ l: p.left, t: p.top, r: p.left + w, b: p.top + h })
        labels.core.style.visibility = "visible"
        labels.core.style.opacity = entered >= 0 ? "0.45" : "1"
        labels.core.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`
      }
    }

    // Most important first: the entered galaxy's works, its own label, the rest.
    const items: LayoutItem[] = []
    const meta = new Map<string, { node: LabelNode; opacity: number; item: LayoutItem }>()
    const add = (key: string, node: LabelNode, anchor: Proj, c: { x: number; y: number }, radiusPx: number, opacity: number) => {
      const [w, h] = sizeOf(node.label)
      const item = { key, anchor, center: c, radiusPx, labelW: w, labelH: h }
      items.push(item)
      meta.set(key, { node, opacity, item })
    }
    const inEntered = new Set<string>()
    if (entered >= 0) {
      const gc = project(cam, scene.galaxies.cPos[entered])
      for (const st of starsOf(entered)) {
        const n = labels.works.get(st.id)
        if (!n) continue
        inEntered.add(st.id)
        const s = project(cam, starPosition(scene, st, t))
        if (!s || !gc || !onScreen(s, 0)) hideLabel(`w:${st.id}`, n)
        else add(`w:${st.id}`, n, s, gc, 10, reveal)
      }
    }
    const order = scene.domainIds.map((_, gi) => gi)
    if (entered >= 0) order.sort((a, b) => (a === entered ? -1 : b === entered ? 1 : 0))
    for (const gi of order) {
      const id = scene.domainIds[gi]
      const n = labels.domains.get(id)
      if (!n) continue
      const s = project(cam, scene.galaxies.cPos[gi])
      if (!s || !onScreen(s, 40)) hideLabel(`d:${id}`, n)
      else add(`d:${id}`, n, s, center, worldToPx(scene.galaxies.sizes[gi], s.z), entered < 0 ? 1 : gi === entered ? 0.55 : 0.4)
    }
    labels.works.forEach((n, id) => {
      if (!inEntered.has(id)) hideLabel(`w:${id}`, n)
    })

    const laid = layoutLabels(items, { viewport, safe: LABEL_SAFE, obstacles, taken, prev: labelPrev })
    const k = 1 - Math.exp(-dt * 10)
    for (const L of laid) {
      const m = meta.get(L.key)
      if (!m) continue
      labelPrev.set(L.key, L.candidate)
      // Ease the leader angle so a label that changes spot swings instead of jumping.
      const target = LABEL_ANGLES[L.candidate]
      const was = labelAngle.get(L.key)
      const a = was === undefined || reduceMotion ? target : was + (target - was) * k
      labelAngle.set(L.key, a)
      const p = Math.abs(a - target) < 1e-3 ? L.placement : placeLabel({ ...m.item, viewport, safe: LABEL_SAFE }, a)
      writeLabel(m.node, p, m.opacity * (L.crowded ? 0.5 : 1))
    }
  }

  function placePreview(cam: CamBasis, t: number) {
    if (!preview || !scene) return
    if (!hover || (hover.kind !== "work" && hover.kind !== "fiction") || panelOpen) return
    const st = hover.kind === "fiction" ? scene.fictionKnot : scene.stars.find((s) => s.id === hover!.id)
    if (!st) return
    const s = project(cam, starPosition(scene, st, t))
    if (!s) return
    const w = preview.offsetWidth || 260
    const h = preview.offsetHeight || 180
    let x = s.x + 26
    let y = s.y - h / 2
    if (x + w > cssW - 16) x = s.x - 26 - w
    if (x < 16) {
      // Too narrow for either side: centre it on the star, above or below.
      x = Math.max(16, Math.min(cssW - w - 16, s.x - w / 2))
      y = s.y + 26 + h <= cssH - 64 ? s.y + 26 : s.y - 26 - h
    }
    y = Math.max(64, Math.min(cssH - h - 64, y))
    preview.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
  }

  // ── Input ────────────────────────────────────────────────────────────
  function attachInput() {
    if (detachInput) return
    detachInput = attachAtlasInput(canvas, {
      onDrag(dx, dy, dtMs) {
        if (!orbit || panelOpen) return
        dragging = true
        dragOrbit(orbit, dx, dy, dtMs, performance.now())
      },
      onRelease(held) {
        dragging = false
        if (orbit) releaseDrag(orbit, reduceMotion ? 999 : held)
      },
      onZoom(cx, cy, k, rate) {
        if (!orbit || !orbitCfg || !lastCam || panelOpen) return
        zoomAt(orbit, orbitCfg, lastCam, [(cx / cssW) * 2 - 1, 1 - (cy / cssH) * 2], [tanX, tanY], k, rate, performance.now())
      },
      onTap(x, y, touch) {
        if (!lastCam || panelOpen) return
        const hit = pick(pickTargets(lastCam, lastT), x, y, touch)
        window.clearTimeout(exitTimer)
        if (!hit) {
          // Wait out the double-click window: a double-click zooms instead.
          if (entered >= 0) exitTimer = window.setTimeout(exitDomain, DOUBLE_TAP_MS)
          return
        }
        activate(hit)
      },
      onDoubleTap(x, y) {
        window.clearTimeout(exitTimer)
        if (!lastCam || !orbit || !orbitCfg || panelOpen) return
        if (pick(pickTargets(lastCam, lastT), x, y, false)) return
        zoomAt(orbit, orbitCfg, lastCam, [(x / cssW) * 2 - 1, 1 - (y / cssH) * 2], [tanX, tanY], 1 / 1.8, 6, performance.now())
      },
      onHover(x, y) {
        if (hoverHeld) return
        const hit = x === null || y === null || !lastCam || panelOpen ? null : pick(pickTargets(lastCam, lastT), x, y, false)
        if (hit || !hover || panelOpen) {
          window.clearTimeout(hoverGrace)
          hoverGrace = 0
          setHover(hit)
          return
        }
        // Leaving a star: keep its preview a moment so the pointer can reach
        // the card (it sits beside the star) and click it.
        if (!hoverGrace) {
          hoverGrace = window.setTimeout(() => {
            hoverGrace = 0
            if (!hoverHeld) setHover(null)
          }, HOVER_GRACE_MS)
        }
      },
      onKey(key: AtlasKey) {
        if (!orbit || !orbitCfg || !lastCam || panelOpen) return
        const now = performance.now()
        if (key === "reset") resetView()
        else if (key === "zoomIn") zoomAt(orbit, orbitCfg, lastCam, [0, 0], [tanX, tanY], 0.7, 8, now)
        else if (key === "zoomOut") zoomAt(orbit, orbitCfg, lastCam, [0, 0], [tanX, tanY], 1 / 0.7, 8, now)
        else {
          const step = 0.18
          orbit.azD += key === "left" ? step : key === "right" ? -step : 0
          orbit.elD = Math.max(-1.1, Math.min(1.1, orbit.elD + (key === "up" ? -step : key === "down" ? step : 0)))
          orbit.rate = 6
          orbit.lastInput = now
        }
      },
    })
  }
  function detach() {
    if (detachInput) detachInput()
    detachInput = null
    window.clearTimeout(exitTimer)
    window.clearTimeout(hoverGrace)
    hoverGrace = 0
    hoverHeld = false
    dragging = false
    setHover(null)
  }

  // ── Commands ─────────────────────────────────────────────────────────
  function activate(t: { kind: PickTarget["kind"]; id: string }) {
    if (panelOpen || mode !== "atlas") return
    window.clearTimeout(exitTimer)
    if (t.kind === "core") {
      focusCore()
      window.clearTimeout(coreTimer)
      coreTimer = window.setTimeout(() => emitCosmosPick({ kind: "core", id: "me" }), reduceMotion ? 0 : 650)
      return
    }
    if (t.kind === "domain") enterDomain(t.id)
    emitCosmosPick({ kind: t.kind, id: t.id })
  }

  function enterDomain(id: string) {
    if (!scene || !orbit) return
    const gi = scene.domainIds.indexOf(id)
    if (gi < 0) return
    entered = gi
    flyTo(orbit, scene.galaxies.cPos[gi], 0.3, reduceMotion ? 30 : 3.2, performance.now())
    setCosmos({ entered: id })
  }
  function exitDomain() {
    if (!orbit || !orbitCfg) return
    if (entered < 0) return
    entered = -1
    setHover(null)
    resetOrbit(orbit, orbitCfg, false)
    if (reduceMotion) orbit.rate = 30
    setCosmos({ entered: null })
  }
  function focusCore() {
    if (!scene || !orbit) return
    flyTo(orbit, scene.target0, 0.24, reduceMotion ? 30 : 3.2, performance.now())
  }
  function resetView() {
    if (!orbit || !orbitCfg) return
    if (entered >= 0) exitDomain()
    else resetOrbit(orbit, orbitCfg, false)
    if (reduceMotion) orbit.rate = 30
  }

  // ── Journey ──────────────────────────────────────────────────────────
  // Each frame: the Atlas into the destination target (no sky), the lookup
  // table for the current throat distance, the lens pass, bloom, composite.
  function journeyFrame(jt: number, t: number) {
    const j = journey!
    const s = res!.sized!
    const p = journeyParams(jt, j.frames, j.speed)
    renderAtlas(res!, scene!, s.destRT, {
      cam: p.dest,
      tanX: j.frames.RT_TAN,
      tanY: j.frames.RT_TAN,
      time: t,
      withSky: false,
      entered: -1,
      reveal: 0,
      hoverStar: -1,
      galDim,
      webDim: 1,
    })
    updateLut(res!, j.lut, p.l)
    lensPass(res!, scene!, p, j.frames, j.lut, t)
    bloomPass(res!, s.hdr)
    composite(res!, s.hdr, t, {
      focus: p.focus,
      zoom: p.zoom,
      ca: p.ca,
      exposure: p.exposure,
      bloomK: p.bloomK,
      grain: p.grain,
      vig: p.vig,
      flash: p.flash,
      streak: p.streak,
    })
  }

  // At J.switch the lens has faded to identity and the destination camera
  // equals the orbit camera at the arrival pose, so direct Atlas rendering
  // takes over with no visible change. The page navigates to /atlas; the
  // canvas stays on top until that route arrives (finishJourney).
  function handOff() {
    const cb = journey?.onHandoff
    if (!journey || !cb) return
    journey.onHandoff = null
    stopJourneyInput()
    cb()
  }

  function finishJourney() {
    setMode("atlas")
    attachInput()
    window.clearTimeout(hudTimer)
    hudTimer = window.setTimeout(() => setCosmos({ hudVisible: true }), 100)
  }

  function abortJourney() {
    const onAbort = journey?.onAbort
    stopJourneyInput()
    journey = null
    window.clearTimeout(hudTimer)
    setCosmos({ hudVisible: true, viaJourney: false })
    onAbort?.()
  }

  // The stage cannot go on (lost context, a render failure) in the middle of
  // a journey: stop it, and if it has not handed off yet, still take the
  // visitor to the Atlas, which then shows the classic view.
  function failJourney(): (() => void) | null {
    if (!journey) return null
    const handoffNow = journey.onHandoff
    abortJourney()
    return handoffNow
  }

  function skip() {
    if (!journey || !journey.onHandoff) return
    const jt = (performance.now() - journey.start) / 1000
    if (jt >= journey.switchAt) return
    journey.start = performance.now() - journey.switchAt * 1000
    const cb = journey.onSkip
    journey.onSkip = null
    cb?.()
  }

  // Click, tap or Escape skips to the hand-off.
  function startJourneyInput() {
    stopJourneyInput()
    const onPointer = (e: PointerEvent) => {
      e.preventDefault()
      skip()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip()
    }
    canvas.addEventListener("pointerdown", onPointer)
    window.addEventListener("keydown", onKey)
    detachJourneyInput = () => {
      canvas.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }
  function stopJourneyInput() {
    if (detachJourneyInput) detachJourneyInput()
    detachJourneyInput = null
  }

  function startJourney(opts: JourneyStart): boolean {
    if (mode === "journey" || failed || lost) return false
    if (idleHandle) cancelIdle(idleHandle)
    idleHandle = 0
    window.clearTimeout(releaseTimer)
    if (!ensureResources(true) || !res || !scene) return false
    performance.mark("cosmos-resources")
    resize()
    try {
      uploadPage(res, res.pageTex, opts.snapshot.page)
      uploadPage(res, res.pageTexB, opts.snapshot.pageNoCta)
    } catch {
      // A tainted snapshot (a cross-origin image without CORS) cannot upload.
      return false
    }
    performance.mark("cosmos-upload")
    const speed = opts.speed > 0 ? opts.speed : 1
    journey = {
      frames: journeyFrames({ viewport: { w: cssW, h: cssH }, ctaCenter: opts.ctaCenter, arrival: scene.arrival }),
      speed,
      start: performance.now(),
      lut: createLutState(),
      onHandoff: opts.onHandoff,
      onSkip: opts.onSkip ?? null,
      onAbort: opts.onAbort ?? null,
      switchAt: J.switch / speed,
      endAt: J.end / speed,
      frozenT: null,
    }
    // The Atlas after the hand-off starts exactly at the arrival pose.
    if (orbit && orbitCfg) resetOrbit(orbit, orbitCfg, true)
    entered = -1
    reveal = 0
    galDim.fill(1)
    webDim = 1
    atlasT = 0
    introBack = 0
    detach()
    setCosmos({ entered: null, hover: null, hudVisible: false, viaJourney: true })
    setMode("journey")
    startJourneyInput()
    startLoop()
    return true
  }

  function enterAtlasMode() {
    window.clearTimeout(releaseTimer)
    stopJourneyInput()
    journey = null
    setMode("atlas")
    // Without topology yet, setTopology() re-enters once the data arrives.
    if (!ensureResources(true)) return
    resize(true)
    if (orbit && orbitCfg) resetOrbit(orbit, orbitCfg, true)
    entered = -1
    reveal = 0
    galDim.fill(1)
    webDim = 1
    atlasT = 0
    introBack = 5
    setCosmos({ entered: null, hover: null, hudVisible: true, viaJourney: false })
    attachInput()
    startLoop()
  }

  /**
   * Free GPU memory (targets, buffers, textures, programs) while keeping the
   * context itself: a canvas can only ever hand out one context, so losing it
   * on purpose would make the next visit fall back to the classic Atlas.
   */
  function releaseGPU() {
    if (res) disposeResources(res)
    res = null
    programs = null
    compiler = null
    orbit = null
  }

  function idleWarmup() {
    idleHandle = 0
    if (mode !== "idle" || failed) return
    if (!ensureContext()) return
    if (!ensurePrograms(false)) {
      idleHandle = requestIdle(idleWarmup)
      return
    }
    if (!ensureResources(false)) {
      if (!topology) return // setTopology schedules another warm-up
      idleHandle = requestIdle(idleWarmup)
      return
    }
    const s = res!.sized!
    if (scene && orbit && orbitCfg) {
      renderAtlas(res!, scene, s.destRT, {
        cam: orbitCamera(orbit, orbitCfg, 0),
        tanX: 1.2,
        tanY: 1.2,
        time: 0,
        withSky: false,
        entered: -1,
        reveal: 0,
        hoverStar: -1,
        galDim,
        webDim: 1,
      })
    }
  }

  const api: Stage = {
    setPath(next: string) {
      path = next
      if (idleHandle) cancelIdle(idleHandle)
      idleHandle = 0
      if (mode === "journey") {
        // The hand-off navigated here: show the Atlas page over the canvas.
        if (isAtlasPath(path) && journey && !journey.onHandoff) {
          finishJourney()
          return
        }
        if (isAtlasPath(path) && !journey) {
          finishJourney()
          return
        }
        // Still on home mid-journey: keep going. Anywhere else: stop.
        if (isHomePath(path)) return
        abortJourney()
      }
      if (isAtlasPath(path)) {
        if (failed || lost || /atlas-legacy/.test(window.location.search)) {
          stopLoop()
          detach()
          setMode("off")
          return
        }
        enterAtlasMode()
      } else if (isHomePath(path)) {
        stopLoop()
        detach()
        window.clearTimeout(releaseTimer)
        setMode(lost ? "off" : "idle")
        if (!failed && !lost) idleHandle = requestIdle(idleWarmup)
      } else {
        stopLoop()
        detach()
        setMode("off")
        window.clearTimeout(releaseTimer)
        releaseTimer = window.setTimeout(() => {
          if (mode === "off") releaseGPU()
        }, 10000)
      }
    },
    setTopology(topo: SceneTopology) {
      topology = topo
      sceneDirty = true
      if (res && ensureScene() && orbit && orbitCfg) {
        // New galaxies: leave any entered galaxy and re-frame the view.
        entered = -1
        galDim.fill(1)
        resetOrbit(orbit, orbitCfg, true)
        setCosmos({ entered: null, hover: null })
      }
      if (mode === "idle" && !idleHandle && !failed && !lost) idleHandle = requestIdle(idleWarmup)
      if (mode === "atlas" && !res && !failed && !lost) enterAtlasMode()
    },
    enterDomain,
    exitDomain,
    focusCore,
    resetView,
    setPanelOpen(open: boolean) {
      panelOpen = open
      if (open) {
        dragging = false
        hoverHeld = false
        window.clearTimeout(hoverGrace)
        hoverGrace = 0
        setHover(null)
      }
      setCosmos({ panelOpen: open })
    },
    activate,
    holdHover(on: boolean) {
      hoverHeld = on
      window.clearTimeout(hoverGrace)
      hoverGrace = 0
      if (!on) setHover(null)
    },
    registerLabels(nodes: LabelNodes) {
      labels = nodes
      measureLabels()
      // Labels re-register when the HUD changes (a galaxy entered or left).
      obstaclesFrame = -1e9
      return () => {
        if (labels === nodes) labels = null
      }
    },
    registerPreview(el: HTMLElement) {
      preview = el
      return () => {
        if (preview === el) preview = null
      }
    },
    pageScale() {
      return Math.min(window.devicePixelRatio || 1, settings.dprCap)
    },
    async startJourney(opts: JourneyStart) {
      return startJourney(opts)
    },
    skipJourney: skip,
    dispose() {
      stopLoop()
      detach()
      if (journey) abortJourney()
      window.clearTimeout(hudTimer)
      if (idleHandle) cancelIdle(idleHandle)
      window.clearTimeout(releaseTimer)
      window.clearTimeout(coreTimer)
      releaseGPU()
      if (gl) {
        canvas.removeEventListener("webglcontextlost", onContextLost)
        canvas.removeEventListener("webglcontextrestored", onContextRestored)
      }
      document.documentElement.removeAttribute("data-cosmos-mode")
    },
  }

  if (debug) {
    ;(window as unknown as { __cosmos: unknown }).__cosmos = {
      api,
      get frames() {
        return frames
      },
      get mode() {
        return mode
      },
      get atlasScale() {
        return atlasScale
      },
      tier: settings.tier,
      /** GPU resources are ready (idle warm-up finished). */
      get warm() {
        return !!res && !!programs
      },
      get orbit() {
        return orbit
      },
      /** Hold a running journey at wall-clock time t (seconds), or release it with null. */
      goto(t: number | null) {
        if (journey) journey.frozenT = t
      },
      get journeyT() {
        return journey ? journeyTime(journey, performance.now()) : null
      },
      screenOf(kind: "core" | "domain" | "work", id: string) {
        if (!lastCam || !scene) return null
        if (kind === "core") return project(lastCam, scene.bh.pos)
        if (kind === "domain") {
          const gi = scene.domainIds.indexOf(id)
          return gi >= 0 ? project(lastCam, scene.galaxies.cPos[gi]) : null
        }
        const st = scene.stars.find((s) => s.id === id)
        return st ? project(lastCam, starPosition(scene, st, lastT)) : null
      },
    }
  }

  return api
}
