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
import { createGL } from "./gl"
import type { GL, GLCaps } from "./gl"
import { detectTier, tierSettings } from "./quality"
import type { TierSettings } from "./quality"
import { createProgramCompiler, createResources, ensureTargets, atlasTarget, disposeResources, uploadScene } from "./resources"
import type { Resources, Programs } from "./resources"
import { buildAtlasScene, starPosition } from "./atlasScene"
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
import { placeLabel, placeCoreLabel, LABEL_SAFE } from "./labels"
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
  snapshot: HTMLCanvasElement
  ctaCenter: { x: number; y: number }
  speed: number
  onHandoff: () => void
}

export interface Stage {
  setPath(path: string): void
  setTopology(topo: SceneTopology): void
  enterDomain(id: string): void
  exitDomain(): void
  focusCore(): void
  resetView(): void
  setPanelOpen(open: boolean): void
  registerLabels(nodes: LabelNodes | null): void
  registerPreview(el: HTMLElement | null): void
  /** Resolves false when the journey cannot run (unsupported or not ready). */
  startJourney(opts: JourneyStart): Promise<boolean>
  skipJourney(): void
  dispose(): void
}

type Proj = { x: number; y: number; z: number }

const DEG = Math.PI / 180
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
  const galDim = new Float32Array(8).fill(1)
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
  let preview: HTMLElement | null = null
  let detachInput: (() => void) | null = null
  let idleHandle = 0
  let releaseTimer = 0
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
    if (failed) return false
    if (gl) return true
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
      scene = buildAtlasScene(topology, { pointsPerGalaxy: settings.pointsPerGalaxy })
      sceneDirty = false
      if (res) uploadScene(res, scene)
    }
    return true
  }

  function ensureResources(blocking: boolean): boolean {
    if (res) return ensureScene()
    if (!ensureContext() || !ensurePrograms(blocking) || !ensureScene()) return false
    res = createResources(gl!, caps!, settings, programs!, scene!)
    resize(true)
    return true
  }

  function onContextLost(e: Event) {
    e.preventDefault()
    stopLoop()
    res = null
    programs = null
    compiler = null
    setCosmos({ support: "lost" })
  }
  function onContextRestored() {
    setCosmos({ support: "ok" })
    if (mode === "atlas" && ensureResources(true)) startLoop()
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
    resize()
    if (mode === "atlas") atlasFrame(dt, t, ms)
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
    const back = reduceMotion ? 0 : introBack * (1 - easeOutCubic(atlasT / 1.8))
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
    placeLabels(cam, t)
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
  function writeLabel(n: LabelNode, anchor: Proj, center: { x: number; y: number }, radiusPx: number, opacity: number) {
    const [w, h] = sizeOf(n.label)
    const p = placeLabel({ anchor, center, radiusPx, labelW: w, labelH: h, viewport: { w: cssW, h: cssH }, safe: LABEL_SAFE })
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

  function placeLabels(cam: CamBasis, t: number) {
    if (!labels || !scene) return
    const core = project(cam, scene.bh.pos)
    const center = core ? { x: core.x, y: core.y } : { x: cssW / 2, y: cssH / 2 }
    if (labels.core) {
      if (!core) hide(labels.core)
      else {
        const [w, h] = sizeOf(labels.core)
        const p = placeCoreLabel({
          center: core,
          diskPx: worldToPx(scene.bh.outer, core.z),
          labelW: w,
          labelH: h,
          viewport: { w: cssW, h: cssH },
          narrow: cssW < 600,
        })
        labels.core.style.visibility = "visible"
        labels.core.style.opacity = entered >= 0 ? "0.45" : "1"
        labels.core.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`
      }
    }
    scene.galaxies.cPos.forEach((c, gi) => {
      const n = labels!.domains.get(scene!.domainIds[gi])
      if (!n) return
      const s = project(cam, c)
      if (!s || s.x < -40 || s.x > cssW + 40 || s.y < -40 || s.y > cssH + 40) {
        hide(n.label)
        hide(n.lead)
        return
      }
      const opacity = entered < 0 ? 1 : gi === entered ? 0.55 : 0.4
      writeLabel(n, s, center, worldToPx(scene!.galaxies.sizes[gi], s.z), opacity)
    })
    const inEntered = new Set<string>()
    if (entered >= 0) {
      const gc = project(cam, scene.galaxies.cPos[entered])
      for (const st of starsOf(entered)) {
        const n = labels.works.get(st.id)
        if (!n) continue
        inEntered.add(st.id)
        const s = project(cam, starPosition(scene, st, t))
        if (!s || !gc) {
          hide(n.label)
          hide(n.lead)
          continue
        }
        writeLabel(n, s, gc, 10, reveal)
      }
    }
    labels.works.forEach((n, id) => {
      if (!inEntered.has(id)) {
        hide(n.label)
        hide(n.lead)
      }
    })
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
        if (!hit) {
          if (entered >= 0) exitDomain()
          return
        }
        if (hit.kind === "domain") enterDomain(hit.id)
        else if (hit.kind === "core") {
          focusCore()
          window.clearTimeout(coreTimer)
          coreTimer = window.setTimeout(() => emitCosmosPick({ kind: "core", id: "me" }), reduceMotion ? 0 : 650)
          return
        }
        emitCosmosPick({ kind: hit.kind, id: hit.id })
      },
      onDoubleTap(x, y) {
        if (!lastCam || !orbit || !orbitCfg || panelOpen) return
        if (pick(pickTargets(lastCam, lastT), x, y, false)) return
        zoomAt(orbit, orbitCfg, lastCam, [(x / cssW) * 2 - 1, 1 - (y / cssH) * 2], [tanX, tanY], 1 / 1.8, 6, performance.now())
      },
      onHover(x, y) {
        if (x === null || y === null || !lastCam || panelOpen) {
          setHover(null)
          return
        }
        setHover(pick(pickTargets(lastCam, lastT), x, y, false))
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
    dragging = false
    setHover(null)
  }

  // ── Commands ─────────────────────────────────────────────────────────
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

  function enterAtlasMode() {
    window.clearTimeout(releaseTimer)
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
    setCosmos({ entered: null, hover: null, hudVisible: true })
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
    setPath(path: string) {
      if (idleHandle) cancelIdle(idleHandle)
      idleHandle = 0
      if (mode === "journey") return
      if (isAtlasPath(path)) {
        if (failed) return
        enterAtlasMode()
      } else if (isHomePath(path)) {
        stopLoop()
        detach()
        window.clearTimeout(releaseTimer)
        setMode("idle")
        if (!failed) idleHandle = requestIdle(idleWarmup)
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
      if (res) ensureScene()
      if (mode === "idle" && !idleHandle && !failed) idleHandle = requestIdle(idleWarmup)
      if (mode === "atlas" && !res && !failed) enterAtlasMode()
    },
    enterDomain,
    exitDomain,
    focusCore,
    resetView,
    setPanelOpen(open: boolean) {
      panelOpen = open
      if (open) {
        dragging = false
        setHover(null)
      }
      setCosmos({ panelOpen: open })
    },
    registerLabels(nodes: LabelNodes | null) {
      labels = nodes
      measureLabels()
    },
    registerPreview(el: HTMLElement | null) {
      preview = el
    },
    async startJourney() {
      return false
    },
    skipJourney() {},
    dispose() {
      stopLoop()
      detach()
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
      get orbit() {
        return orbit
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
