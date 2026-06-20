/**
 * AtlasCanvas — the single-canvas galaxy scene + rAF render loop + interaction.
 * Ported (near-verbatim) from the prototype's `portfolio-atlas.jsx`. The look is
 * a hand-tuned 2D projection; this is deliberately NOT Three.js/R3F.
 *
 * Production changes vs the prototype:
 *   - `DOMAINS` / `NB_FICTION` are now the `domains` / `fiction` props.
 *   - Panels come from the imported AtlasPanelRouter (fed essays/changelog too).
 *   - The wordmark links ← HOME via the site's TransitionLink.
 *   - a11y: prefers-reduced-motion damps auto-spin + skips the warp; the loop
 *     pauses on visibilitychange (hidden) but keeps running through warps.
 *   - touch: drag to rotate, pinch to zoom, tap to select (≥44px hub targets).
 */
import React, { useEffect, useMemo, useRef, useState } from "react"
import TransitionLink from "gatsby-plugin-transition-link"
import { NB as A, NB_MONO as MONO, NB_DISP as DISP, hx } from "./atlasShared"
import type {
  AtlasDomain,
  AtlasWork,
  FictionStory,
  EssayItem,
  ChangelogItem,
  RGB,
} from "./atlasShared"
import { AtlasPanelRouter } from "./AtlasPanels"
import type { AtlasPanelState } from "./AtlasPanels"
import { ProjectRail } from "./ProjectRail"
import type {
  SceneState,
  Scene,
  Vec3,
  HubWithWorld,
  SceneNode,
  SceneStar,
  SceneOrbit,
  OrbHive,
  Signal,
  PlanetHit,
  Projected,
  ProjFn,
} from "./sceneTypes"

const R = 310
const ENTERED_ORBIT_BASE = 42
const ENTERED_ORBIT_GAP = 22
const ENTERED_ORBIT_JITTER = 6
const SHELLED_ORBIT_BASE = 28
const SHELLED_ORBIT_GAP = 16
const SHELLED_ORBIT_JITTER = 4
const ORBIT_ANGLE_STEP = Math.PI * (3 - Math.sqrt(5))

// Per-planet color: blend the cluster hue toward a varied tint so siblings differ.
const ORB_TINTS = ["#8fd4ff", "#ff9ec9", "#ffd089", "#b59cff", "#8effc4", "#ff8f7a", "#9fb4ff"]
function varyRGB(base: string, i: number, rnd?: () => number): [number, number, number] {
  const [r, g, b] = hx(base)
  const [tr, tg, tb] = hx(ORB_TINTS[(i + Math.floor((rnd ? rnd() : 0) * 7)) % ORB_TINTS.length])
  const m = 0.4 + (rnd ? rnd() : 0.3) * 0.25
  return [(r * (1 - m) + tr * m) | 0, (g * (1 - m) + tg * m) | 0, (b * (1 - m) + tb * m) | 0]
}

// Dim, dimensional luminous body: a nervous swarm in a loose shell with trails.
function drawOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rad: number,
  rgb: [number, number, number],
  lit: { x: number; y: number },
  ep: number,
  hov: boolean,
  t: number,
  store: OrbHive
) {
  const [r, g, b] = rgb
  if (!store.hive) {
    let s = (store.seed || 1) * 9973
    const rr = () => {
      s = (s * 16807) % 2147483647
      return s / 2147483647
    }
    store.hive = Array.from({ length: 22 }, () => ({
      a: rr() * 6.28,
      rad: 0.45 + rr() * 0.62,
      sp: (0.3 + rr() * 0.6) * (rr() > 0.5 ? 1 : -1),
      wob: rr() * 6.28,
      sz: 0.8 + rr() * 1.0,
    }))
  }
  ctx.globalCompositeOperation = "lighter"
  // faint binding haze so the swarm reads as one body
  const cg = ctx.createRadialGradient(x, y, 0, x, y, rad * 1.5)
  cg.addColorStop(0, `rgba(${r},${g},${b},${0.1 * ep})`)
  cg.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = cg
  ctx.beginPath()
  ctx.arc(x, y, rad * 1.5, 0, 6.28)
  ctx.fill()
  // a dim lit nucleus toward the sun for a touch of depth
  const lx = x + lit.x * rad * 0.3,
    ly = y + lit.y * rad * 0.3
  const nuc = ctx.createRadialGradient(lx, ly, 0, x, y, rad * 0.6)
  nuc.addColorStop(
    0,
    `rgba(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 40)},${0.22 * ep})`
  )
  nuc.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = nuc
  ctx.beginPath()
  ctx.arc(x, y, rad * 0.6, 0, 6.28)
  ctx.fill()
  // swarm members
  for (const p of store.hive) {
    const ang = p.a + t * p.sp
    const jit = Math.sin(t * 6 + p.wob) * 0.08
    const orr = (p.rad + jit) * rad
    const px = x + Math.cos(ang) * orr,
      py = y + Math.sin(ang) * orr
    const ang2 = ang - p.sp * 0.12
    const px2 = x + Math.cos(ang2) * orr,
      py2 = y + Math.sin(ang2) * orr
    ctx.strokeStyle = `rgba(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${b},${0.28 * ep})`
    ctx.lineWidth = p.sz * 0.7
    ctx.beginPath()
    ctx.moveTo(px2, py2)
    ctx.lineTo(px, py)
    ctx.stroke()
    const tw = 0.55 + 0.45 * Math.sin(t * 5 + p.wob)
    ctx.fillStyle = `rgba(255,255,255,${0.85 * tw * ep})`
    ctx.beginPath()
    ctx.arc(px, py, p.sz * (0.7 + 0.3 * tw), 0, 6.28)
    ctx.fill()
  }
  ctx.globalCompositeOperation = "source-over"
  if (hov) {
    const pulse = 1 + 0.05 * Math.sin(t * 3)
    const RR = rad * 2.0 * pulse
    ctx.globalCompositeOperation = "lighter"
    ctx.lineWidth = 1.3
    for (let pass = 0; pass < 2; pass++) {
      const spin = t * (pass ? -0.9 : 1.3) + pass * 0.8
      const segs = 3,
        gap = 0.42
      ctx.strokeStyle = `rgba(255,255,255,${(pass ? 0.3 : 0.55) * ep})`
      for (let sgi = 0; sgi < segs; sgi++) {
        const a0 = spin + sgi * (6.28 / segs)
        ctx.beginPath()
        ctx.arc(x, y, RR * (pass ? 0.86 : 1), a0, a0 + 6.28 / segs - gap)
        ctx.stroke()
      }
    }
    for (let n = 0; n < 4; n++) {
      const na = -t * 1.1 + n * (6.28 / 4)
      const nx = x + Math.cos(na) * RR,
        ny = y + Math.sin(na) * RR
      const tw = 0.6 + 0.4 * Math.sin(t * 4 + n)
      ctx.fillStyle = `rgba(255,255,255,${0.8 * tw * ep})`
      ctx.beginPath()
      ctx.arc(nx, ny, 1.6, 0, 6.28)
      ctx.fill()
    }
    ctx.globalCompositeOperation = "source-over"
  }
}

// Constellation between hubs — indices into the canonical hub order:
// [me, obsidian, web, games, tools, music, writing, ai, sites].
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 2],
  [2, 4],
  [3, 6],
  [6, 1],
  [5, 4],
  [7, 4],
  [7, 2],
  [2, 8],
]

function buildScene(domains: AtlasDomain[]): Scene {
  let seed = 7
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 1.4

  const hubs: HubWithWorld[] = domains.map(c => ({
    ...c,
    w: [c.p[0] * R, c.p[1] * R, c.p[2] * R] as Vec3,
  }))
  const nodes: SceneNode[] = []
  hubs.forEach((h: HubWithWorld, ci: number) => {
    const spread = h.core ? 26 : 42
    const bright = h.core ? 6 : h.count || (h.works ? h.works.length : 3)
    const dust = h.core ? 16 : 20 + bright * 5
    for (let i = 0; i < bright; i++) {
      nodes.push({
        ci,
        w: [h.w[0] + gauss() * spread, h.w[1] + gauss() * spread, h.w[2] + gauss() * spread] as Vec3,
        r: 1.8 + rnd() * 1.4,
        c: h.c,
        warm: h.warm,
        tw: rnd() * 6.28,
        hub: false,
      })
    }
    for (let i = 0; i < dust; i++) {
      nodes.push({
        ci,
        w: [
          h.w[0] + gauss() * spread * 1.5,
          h.w[1] + gauss() * spread * 1.5,
          h.w[2] + gauss() * spread * 1.5,
        ] as Vec3,
        r: 0.5 + rnd() * 0.8,
        c: h.c,
        warm: h.warm,
        tw: rnd() * 6.28,
        hub: false,
        dust: true,
      })
    }
    nodes.push({ ci, w: [...h.w] as Vec3, r: h.core ? 4.6 : 3.2, c: h.c, warm: h.warm, hub: true, label: h.label })
  })
  const stars: SceneStar[] = []
  for (let i = 0; i < 520; i++) {
    const u = rnd() * 2 - 1,
      th = rnd() * 6.28,
      rr = 360 + rnd() * 220
    const s = Math.sqrt(1 - u * u)
    stars.push({ w: [Math.cos(th) * s * rr, Math.sin(th) * s * rr, u * rr] as Vec3, r: 0.5 + rnd() * 1.1, tw: rnd() * 6.28 })
  }
  // each cluster's works become planets orbiting the hub-star
  const planets: SceneOrbit[][] = hubs.map((h: HubWithWorld) => {
    if (h.core || !h.works) return []
    const perShell: Record<number, number> = {}
    // shelled clusters (writing): only shell-0 (essays) orbit as bodies;
    // fiction (shell 1) collapses into a single clickable sub-star (drawn in render).
    const orbiting = h.shells ? h.works.filter((w: AtlasWork) => (w.shell || 0) === 0) : h.works
    return orbiting.map((wk: AtlasWork, i: number) => {
      const sh = wk.shell || 0
      perShell[sh] = perShell[sh] || 0
      const idxInShell = perShell[sh]++
      const orbitR = h.shells
        ? SHELLED_ORBIT_BASE + idxInShell * SHELLED_ORBIT_GAP + rnd() * SHELLED_ORBIT_JITTER
        : ENTERED_ORBIT_BASE + i * ENTERED_ORBIT_GAP + rnd() * ENTERED_ORBIT_JITTER
      return {
        work: wk,
        c: h.c,
        rgb: varyRGB(h.c, i, rnd),
        shell: sh,
        orbitR,
        ang: (h.shells ? idxInShell : i) * ORBIT_ANGLE_STEP + rnd() * 0.35,
        speed: (0.1 + rnd() * 0.14) * (i % 2 ? -1 : 1) * (h.shells ? 0.7 : 1),
        size: 2.6 + rnd() * 1.6,
        inc: (rnd() - 0.5) * 0.6,
        seed: rnd() * 100,
      }
    })
  })
  return { hubs, nodes, stars, planets }
}

function drawGizmo(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: SceneState, proj: ProjFn) {
  const o = proj([0, 0, 0], { ...s, zoom: 1 })
  const base = { sx: ox, sy: oy }
  ;([
    ["#ff2b46", [40, 0, 0]],
    ["#2bf0ff", [0, -40, 0]],
    ["#8c4fd1", [0, 0, 40]],
  ] as [string, number[]][]).forEach(([col, v]) => {
    const p = proj(v, { ...s, zoom: 1 })
    const dx = p.sx - o.sx,
      dy = p.sy - o.sy
    ctx.strokeStyle = col
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(base.sx, base.sy)
    ctx.lineTo(base.sx + dx, base.sy + dy)
    ctx.stroke()
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(base.sx + dx, base.sy + dy, 2, 0, 6.28)
    ctx.fill()
  })
  ctx.strokeStyle = "rgba(150,165,220,0.25)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(base.sx, base.sy, 30, 0, 6.28)
  ctx.stroke()
}

export interface AtlasCanvasProps {
  domains: AtlasDomain[]
  fiction?: FictionStory[]
  essays?: EssayItem[]
  changelog?: ChangelogItem[]
}

export default function AtlasCanvas({
  domains,
  fiction = [],
  essays = [],
  changelog = [],
}: AtlasCanvasProps) {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const scene = useMemo(() => buildScene(domains), [domains])
  const st = useRef<SceneState>({
    rx: -0.2,
    ry: 0.5,
    zoom: 1.32,
    drag: false,
    lx: 0,
    ly: 0,
    vry: 0,
    vrx: 0,
    lastUser: -999,
    hover: -1,
    focus: -1,
    signals: [],
    pan: { x: 0, y: 0 },
    panTX: 0,
    panTY: 0,
    entered: -1,
    enterP: 0,
    hoverPlanet: -1,
    _planetHits: null,
  })
  const [info, setInfo] = useState({ hover: -1, focus: -1 })
  const [entered, setEntered] = useState(-1)
  const [term, setTerm] = useState(false)
  const [panel, setPanel] = useState<AtlasPanelState | null>(null)
  const panelRef = useRef(false)
  useEffect(() => {
    panelRef.current = !!panel
  }, [panel])

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const fictionCount = fiction.length || 7
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let W = 0,
      H = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      const r = wrapRef.current!.getBoundingClientRect()
      W = r.width
      H = r.height
      cv.width = W * dpr
      cv.height = H * dpr
      cv.style.width = W + "px"
      cv.style.height = H + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    // film-grain tile — large & subtle so tiling never reads as a grid
    const GRAIN = 360
    const grain = document.createElement("canvas")
    grain.width = grain.height = GRAIN
    const gctx = grain.getContext("2d")!
    const gimg = gctx.createImageData(GRAIN, GRAIN)
    for (let i = 0; i < gimg.data.length; i += 4) {
      const v = (118 + Math.random() * 120) | 0
      gimg.data[i] = gimg.data[i + 1] = gimg.data[i + 2] = v
      gimg.data[i + 3] = 255
    }
    gctx.putImageData(gimg, 0, 0)

    const FOCAL = 920
    const proj = (w: number[], s: SceneState): Projected => {
      const { rx, ry } = s
      const cy = Math.cos(ry),
        sy = Math.sin(ry),
        cx = Math.cos(rx),
        sx = Math.sin(rx)
      const x = w[0] * cy + w[2] * sy
      let z = -w[0] * sy + w[2] * cy
      const y = w[1] * cx - z * sx
      z = w[1] * sx + z * cx
      const scale = (FOCAL / (FOCAL + z)) * s.zoom
      const px = s.pan ? s.pan.x : 0,
        py = s.pan ? s.pan.y : 0
      return { sx: W / 2 + x * scale + px, sy: H / 2 + y * scale + py, z, scale }
    }

    let t0 = performance.now(),
      raf = 0,
      paused = false
    const loop = (t: number) => {
      const s = st.current
      const dt = Math.min(0.05, (t - t0) / 1000)
      t0 = t
      const now = t / 1000
      if (!s.drag) {
        s.ry += s.vry
        s.rx += s.vrx
        s.vry *= 0.94
        s.vrx *= 0.94
        if (s.focus < 0) {
          // idle drift eases in over ~1.5s after the last drag (skipped if reduced motion)
          const ramp = Math.max(0, Math.min(1, (now - s.lastUser - 0.4) / 1.5))
          if (!reduce) s.ry += 0.0016 * ramp
        }
      }
      s.rx = Math.max(-1.2, Math.min(1.2, s.rx))

      // camera: warp-dive into entered cluster (spiral plunge), else fly-to / zoom-out
      const camF = s.entered >= 0 ? s.entered : s.focus
      let warpEnv = 0
      if (camF >= 0) {
        if (s.entered >= 0 && !reduce) {
          const we = now - (s.warpStart || now)
          warpEnv = we < 0.32 ? we / 0.32 : Math.max(0, 1 - (we - 0.32) / 0.5)
          s.ry += warpEnv * 0.018 // barely any rotation
          s.rx += warpEnv * 0.005 * Math.sin(we * 3) // faint sway
        }
        s.warpEnv = warpEnv
        const cyy = s.entered >= 0 ? 0.5 : 0.46
        // shelled clusters (writing): frame the midpoint between essays star & fiction sub-star
        const camHub = scene.hubs[camF]
        const tgt =
          s.entered >= 0 && camHub.shells
            ? [camHub.w[0] + 66, camHub.w[1] + 8, camHub.w[2] - 23]
            : camHub.w
        const hpf = proj(tgt, s)
        s.panTX = W * 0.5 - hpf.sx + s.pan.x
        s.panTY = H * cyy - hpf.sy + s.pan.y
        const tz = s.entered >= 0 ? (camHub.shells ? 2.9 : 3.6) + warpEnv * 0.4 : 1.75
        if (!s.userZoomed) s.zoom += (tz - s.zoom) * (reduce ? 0.4 : 0.1 + warpEnv * 0.08)
      } else {
        s.panTX = 0
        s.panTY = 0
        if (s.exiting) {
          if (reduce) {
            s.exiting = false
            s.warpEnv = 0
          } else {
            const we = now - (s.exitStart || now)
            s.warpEnv = we < 0.45 ? we / 0.45 : Math.max(0, 1 - (we - 0.45) / 0.8)
            if (we > 1.3) {
              s.exiting = false
              s.warpEnv = 0
            }
          }
        } else {
          s.warpEnv = 0
        }
        if (!s.userZoomed) s.zoom += (1.32 - s.zoom) * (reduce ? 0.4 : 0.06)
      }
      s.rx = Math.max(-1.35, Math.min(1.35, s.rx))
      s.pan.x += (s.panTX - s.pan.x) * 0.07
      s.pan.y += (s.panTY - s.pan.y) * 0.07
      s.enterP += ((s.entered >= 0 ? 1 : 0) - s.enterP) * 0.1
      const gal = 1 - s.enterP * 0.9

      ctx.clearRect(0, 0, W, H)
      const g = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, Math.max(W, H) * 0.6)
      g.addColorStop(0, "rgba(40,32,90,0.18)")
      g.addColorStop(0.5, "rgba(16,14,40,0.06)")
      g.addColorStop(1, "rgba(5,5,9,0)")
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)

      // lens center for spacetime bending (active during warp)
      let _wc: { x: number; y: number; we: number; dir: number; maxR: number } | null = null
      if (s.warpEnv > 0.02) {
        let lcx = W / 2,
          lcy = H / 2
        if (s.entered >= 0) {
          const hp0 = proj(scene.hubs[s.entered].w, s)
          lcx = hp0.sx
          lcy = hp0.sy
        }
        _wc = { x: lcx, y: lcy, we: s.warpEnv, dir: s.exiting ? -1 : 1, maxR: Math.hypot(W, H) }
      }
      const bend = (px: number, py: number): [number, number] => {
        if (!_wc) return [px, py]
        const dx = px - _wc.x,
          dy = py - _wc.y
        const r = Math.hypot(dx, dy) || 1
        const RR = r * (1 - 0.42 * _wc.we * Math.exp(-r / (_wc.maxR * 0.22)))
        const a = Math.atan2(dy, dx) + _wc.dir * _wc.we * 1.5 * Math.exp(-r / (_wc.maxR * 0.26))
        return [_wc.x + Math.cos(a) * RR, _wc.y + Math.sin(a) * RR]
      }

      for (const star of scene.stars) {
        const pr = proj(star.w, s)
        const a = (0.15 + 0.2 * (0.5 + 0.5 * Math.sin(now * 1.2 + star.tw))) * Math.min(1, pr.scale)
        const [bx, by] = bend(pr.sx, pr.sy)
        ctx.fillStyle = `rgba(180,195,255,${a})`
        ctx.beginPath()
        ctx.arc(bx, by, star.r * pr.scale, 0, 6.28)
        ctx.fill()
      }

      const hp = scene.hubs.map(h => proj(h.w, s))

      // volumetric cluster haze (additive bloom)
      ctx.globalCompositeOperation = "lighter"
      ;scene.hubs.forEach((h, i) => {
        const pr = hp[i]
        const fd = s.focus >= 0 && s.focus !== i ? 0.22 : 1
        const rad = (h.core ? 46 : 78) * pr.scale * (h.id === "music" ? 1.2 : 1)
        const [r, gg, bl] = hx(h.c)
        const gr = ctx.createRadialGradient(pr.sx, pr.sy, 0, pr.sx, pr.sy, rad)
        gr.addColorStop(0, `rgba(${r},${gg},${bl},${0.13 * fd * gal})`)
        gr.addColorStop(0.45, `rgba(${r},${gg},${bl},${0.05 * fd * gal})`)
        gr.addColorStop(1, `rgba(${r},${gg},${bl},0)`)
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.arc(pr.sx, pr.sy, rad, 0, 6.28)
        ctx.fill()
      })
      ctx.globalCompositeOperation = "source-over"

      ctx.lineWidth = 1
      EDGES.forEach(([a, b]) => {
        const A1 = hp[a],
          B1 = hp[b]
        if (!A1 || !B1) return
        const dim = s.focus >= 0 && s.focus !== a && s.focus !== b ? 0.2 : 1
        ctx.strokeStyle = `rgba(130,155,255,${0.12 * dim * gal})`
        ctx.beginPath()
        ctx.moveTo(A1.sx, A1.sy)
        ctx.lineTo(B1.sx, B1.sy)
        ctx.stroke()
      })
      for (const nd of scene.nodes) {
        if (nd.hub) continue
        const H1 = hp[nd.ci],
          pr = proj(nd.w, s)
        const fd = s.focus >= 0 && s.focus !== nd.ci ? 0.12 : s.hover >= 0 && s.hover !== nd.ci ? 0.4 : 1
        const [r, gg, bl] = hx(nd.c)
        ctx.strokeStyle = `rgba(${r},${gg},${bl},${0.05 * fd * gal * Math.min(1, pr.scale)})`
        ctx.beginPath()
        ctx.moveTo(H1.sx, H1.sy)
        ctx.lineTo(pr.sx, pr.sy)
        ctx.stroke()
      }

      if (Math.random() < 0.04 && s.signals.length < 14) {
        const e = EDGES[Math.floor(Math.random() * EDGES.length)]
        s.signals.push({ e, p: 0, sp: 0.4 + Math.random() * 0.5 })
      }
      s.signals = s.signals.filter((sig: Signal) => sig.p < 1)
      s.signals.forEach((sig: Signal) => {
        sig.p += sig.sp * dt
        const A1 = hp[sig.e[0]],
          B1 = hp[sig.e[1]]
        const x = A1.sx + (B1.sx - A1.sx) * sig.p,
          y = A1.sy + (B1.sy - A1.sy) * sig.p
        const col = hx(scene.hubs[sig.e[0]].c)
        const a = 0.9 * (1 - Math.abs(sig.p - 0.5) * 1.5) * gal
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`
        ctx.beginPath()
        ctx.arc(x, y, 2.2, 0, 6.28)
        ctx.fill()
      })

      const drawn = scene.nodes
        .map(nd => ({ nd, pr: proj(nd.w, s) }))
        .sort((p, q) => q.pr.z - p.pr.z)
      for (const { nd, pr } of drawn) {
        const depthA = Math.max(0.22, Math.min(1, (pr.scale - 0.5) / 0.8))
        const fd = s.focus >= 0 && s.focus !== nd.ci ? 0.2 : s.hover >= 0 && s.hover !== nd.ci ? 0.5 : 1
        const [r, gg, bl] = hx(nd.c)
        const baseA = (nd.hub ? 0.98 : nd.dust ? 0.6 : 0.85) * depthA * fd * gal
        if (nd.hub) {
          const ph0 = nd.ci * 1.7
          const pulse = 0.85 + 0.15 * Math.sin(now * 1.1 + ph0)
          // layered drifting corona — 3 soft offset lobes instead of one flat glow
          ctx.globalCompositeOperation = "lighter"
          for (let L = 0; L < 3; L++) {
            const lph = now * 0.5 + L * 2.1 + ph0
            const ox = pr.sx + Math.sin(lph) * nd.r * pr.scale * 0.9
            const oy = pr.sy + Math.cos(lph * 0.8) * nd.r * pr.scale * 0.8
            const RR = nd.r * pr.scale * (6 - L * 1.4) * pulse
            const g2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, RR)
            g2.addColorStop(0, `rgba(${r},${gg},${bl},${(0.26 - L * 0.07) * depthA * fd})`)
            g2.addColorStop(1, `rgba(${r},${gg},${bl},0)`)
            ctx.fillStyle = g2
            ctx.beginPath()
            ctx.arc(ox, oy, RR, 0, 6.28)
            ctx.fill()
          }
          // faint slow-orbiting motes (subtle satellites)
          for (let m = 0; m < 5; m++) {
            const ma = now * (0.18 + m * 0.04) * (m % 2 ? -1 : 1) + m * 1.3 + ph0
            const mr = nd.r * pr.scale * (2.6 + m * 0.7)
            const mx = pr.sx + Math.cos(ma) * mr,
              my = pr.sy + Math.sin(ma) * mr
            const mtw = 0.4 + 0.6 * Math.abs(Math.sin(now * 0.9 + m * 1.7 + ph0))
            ctx.fillStyle = `rgba(${Math.min(255, r + 40)},${Math.min(255, gg + 45)},${Math.min(
              255,
              bl + 55
            )},${0.32 * mtw * depthA * fd * gal})`
            ctx.beginPath()
            ctx.arc(mx, my, 0.9 * pr.scale, 0, 6.28)
            ctx.fill()
          }
          ctx.globalCompositeOperation = "source-over"
          // graded core body (bright center → hue edge) instead of a flat disk
          const cr = nd.r * pr.scale * 1.5
          const core = ctx.createRadialGradient(pr.sx - cr * 0.3, pr.sy - cr * 0.3, 0, pr.sx, pr.sy, cr)
          core.addColorStop(0, `rgba(255,255,255,${baseA})`)
          core.addColorStop(
            0.45,
            `rgba(${Math.min(255, r + 60)},${Math.min(255, gg + 60)},${Math.min(255, bl + 70)},${baseA})`
          )
          core.addColorStop(1, `rgba(${r},${gg},${bl},${baseA * 0.7})`)
          ctx.fillStyle = core
          ctx.beginPath()
          ctx.arc(pr.sx, pr.sy, cr, 0, 6.28)
          ctx.fill()
          // rotating specular glint that sweeps across the core (glisten)
          ctx.globalCompositeOperation = "lighter"
          const ga = now * 0.9 + ph0
          const gx = pr.sx + Math.cos(ga) * cr * 0.4,
            gy = pr.sy + Math.sin(ga) * cr * 0.4
          const glint = ctx.createRadialGradient(gx, gy, 0, gx, gy, cr * 0.7)
          glint.addColorStop(0, `rgba(255,255,255,${0.5 * depthA * fd})`)
          glint.addColorStop(1, "rgba(255,255,255,0)")
          ctx.fillStyle = glint
          ctx.beginPath()
          ctx.arc(gx, gy, cr * 0.7, 0, 6.28)
          ctx.fill()
          // tiny twinkling sparkles clinging to the core
          for (let sp = 0; sp < 6; sp++) {
            const sa2 = sp * 2.39996 + now * 0.4 + ph0
            const srr = cr * (0.55 + ((sp * 0.31) % 1) * 0.7)
            const sx2 = pr.sx + Math.cos(sa2) * srr,
              sy2 = pr.sy + Math.sin(sa2) * srr
            const stw = Math.max(0, Math.sin(now * 3 + sp * 1.9 + ph0))
            const sval = stw * stw * 0.85 * depthA * fd
            if (sval < 0.05) continue
            const ssz = 0.5 + stw * 1.0
            ctx.fillStyle = `rgba(255,255,255,${sval})`
            ctx.fillRect(sx2 - ssz / 2, sy2 - ssz / 2, ssz, ssz)
            ctx.fillStyle = `rgba(255,255,255,${sval * 0.35})`
            ctx.fillRect(sx2 - ssz * 1.8, sy2 - 0.3, ssz * 3.6, 0.6)
            ctx.fillRect(sx2 - 0.3, sy2 - ssz * 1.8, 0.6, ssz * 3.6)
          }
          ctx.globalCompositeOperation = "source-over"
        }
        if (!nd.hub) {
          ctx.fillStyle = `rgba(${nd.warm ? 245 : 225},${nd.warm ? 225 : 232},${nd.warm ? 200 : 255},${baseA})`
          ctx.beginPath()
          ctx.arc(pr.sx, pr.sy, Math.max(0.4, nd.r * pr.scale), 0, 6.28)
          ctx.fill()
        }
        if (!nd.hub && !nd.dust && depthA > 0.5) {
          ctx.globalCompositeOperation = "lighter"
          const bg = ctx.createRadialGradient(pr.sx, pr.sy, 0, pr.sx, pr.sy, nd.r * pr.scale * 4)
          bg.addColorStop(0, `rgba(${nd.warm ? 245 : 200},${nd.warm ? 220 : 220},${nd.warm ? 190 : 255},${0.4 * depthA * fd})`)
          bg.addColorStop(1, "rgba(0,0,0,0)")
          ctx.fillStyle = bg
          ctx.beginPath()
          ctx.arc(pr.sx, pr.sy, nd.r * pr.scale * 4, 0, 6.28)
          ctx.fill()
          ctx.globalCompositeOperation = "source-over"
        }
        if (nd.hub) {
          // soft pulsing halo ring (replaces the hard white circle)
          const ph0 = nd.ci * 1.7
          const rpulse = 1 + 0.08 * Math.sin(now * 1.4 + ph0)
          ctx.strokeStyle = `rgba(255,255,255,${0.22 * depthA * fd})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(pr.sx, pr.sy, (nd.r * pr.scale + 4) * rpulse, 0, 6.28)
          ctx.stroke()
        }
      }

      ctx.textBaseline = "top"
      ;scene.hubs.forEach((h, i) => {
        const pr = hp[i]
        const front = Math.max(0, Math.min(1, (pr.scale - 0.7) / 0.6))
        if (front <= 0.05) return
        const focused = s.focus === i || s.hover === i
        const dim = s.focus >= 0 && s.focus !== i ? 0.3 : 1
        const a = front * dim * gal
        ctx.font = `600 ${h.core ? 12 : 11}px ${MONO}`
        ctx.fillStyle = `rgba(230,236,255,${a})`
        ctx.fillText(h.label, pr.sx + 10, pr.sy - 4)
        if (front > 0.55 || focused) {
          ctx.font = `400 9px ${MONO}`
          ctx.fillStyle = `rgba(150,165,220,${a * 0.85})`
          const sub = h.core
            ? (h.tag || "").toUpperCase()
            : `${(h.tag || "").toUpperCase()} · ${h.count} ${(h.unit || "").toUpperCase()}`
          ctx.fillText(sub, pr.sx + 10, pr.sy + 11)
        }
      })

      // ── entered cluster → solar system ──
      if (s.entered >= 0 && s.enterP > 0.02) {
        const hub = scene.hubs[s.entered]
        const sys = scene.planets[s.entered] || []
        const hubPr = proj(hub.w, s)
        const [hr, hg, hb] = hx(hub.c)
        const ep = s.enterP
        // ── fuzzy, flowing plasma sun ──
        ctx.globalCompositeOperation = "lighter"
        const baseR = 70 * ep
        for (let L = 0; L < 6; L++) {
          const ph = now * (0.5 + L * 0.12) + L * 1.7
          const ox = hubPr.sx + Math.sin(ph) * baseR * 0.28,
            oy = hubPr.sy + Math.cos(ph * 0.85 + L) * baseR * 0.26
          const R2 = baseR * (1.15 - L * 0.13) * (0.85 + 0.15 * Math.sin(now * 0.9 + L * 1.3))
          const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, R2)
          const wht = L < 2
          gr.addColorStop(0, wht ? `rgba(255,255,255,${0.5 * ep})` : `rgba(${hr},${hg},${hb},${0.32 * ep})`)
          gr.addColorStop(0.5, `rgba(${hr},${hg},${hb},${0.14 * ep})`)
          gr.addColorStop(1, `rgba(${hr},${hg},${hb},0)`)
          ctx.fillStyle = gr
          ctx.beginPath()
          ctx.arc(ox, oy, R2, 0, 6.28)
          ctx.fill()
        }
        for (let w = 0; w < 10; w++) {
          const wa = (w / 10) * 6.28 + now * 0.3
          const fl = baseR * (1.3 + 0.5 * Math.sin(now * 1.6 + w * 1.4))
          const wx = hubPr.sx + Math.cos(wa) * fl,
            wy = hubPr.sy + Math.sin(wa) * fl
          const wr = baseR * 0.42 * (0.5 + 0.5 * Math.sin(now * 2 + w))
          const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr)
          wg.addColorStop(
            0,
            `rgba(${Math.min(255, hr + 40)},${Math.min(255, hg + 40)},${Math.min(255, hb + 40)},${0.12 * ep})`
          )
          wg.addColorStop(1, `rgba(${hr},${hg},${hb},0)`)
          ctx.fillStyle = wg
          ctx.beginPath()
          ctx.arc(wx, wy, wr, 0, 6.28)
          ctx.fill()
        }
        ctx.globalCompositeOperation = "source-over"
        const crg = ctx.createRadialGradient(hubPr.sx, hubPr.sy, 0, hubPr.sx, hubPr.sy, 9 * ep + 3)
        crg.addColorStop(0, `rgba(255,255,255,${ep})`)
        crg.addColorStop(1, `rgba(${Math.min(255, hr + 80)},${Math.min(255, hg + 80)},${Math.min(255, hb + 80)},0)`)
        ctx.fillStyle = crg
        ctx.beginPath()
        ctx.arc(hubPr.sx, hubPr.sy, 9 * ep + 3, 0, 6.28)
        ctx.fill()
        const hits: PlanetHit[] = []
        const FICTION_OFF = [132, 16, -46]
        const secCenter = (pl: SceneOrbit) =>
          hub.shells && pl.shell === 1
            ? [hub.w[0] + FICTION_OFF[0], hub.w[1] + FICTION_OFF[1], hub.w[2] + FICTION_OFF[2]]
            : hub.w
        // fiction sub-star + section glows
        s._fictionHit = null
        if (hub.shells && ep > 0.3) {
          const fc = proj([hub.w[0] + FICTION_OFF[0], hub.w[1] + FICTION_OFF[1], hub.w[2] + FICTION_OFF[2]], s)
          const [fr, fg, fb] = hx("#caa6f2")
          const fhov = s.hoverFiction
          ctx.globalCompositeOperation = "lighter"
          for (let L = 0; L < 4; L++) {
            const ph = now * (0.45 + L * 0.1) + L * 1.9
            const ox = fc.sx + Math.sin(ph) * 22,
              oy = fc.sy + Math.cos(ph * 0.8 + L) * 20
            const R2 = (38 - L * 7) * ep * (0.85 + 0.15 * Math.sin(now * 0.8 + L)) * (fhov ? 1.18 : 1)
            const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, R2)
            gr.addColorStop(0, L < 1 ? `rgba(245,240,255,${(fhov ? 0.5 : 0.4) * ep})` : `rgba(${fr},${fg},${fb},${0.26 * ep})`)
            gr.addColorStop(1, `rgba(${fr},${fg},${fb},0)`)
            ctx.fillStyle = gr
            ctx.beginPath()
            ctx.arc(ox, oy, R2, 0, 6.28)
            ctx.fill()
          }
          for (let m = 0; m < fictionCount; m++) {
            const ma = now * 0.4 * (m % 2 ? -1 : 1) + m * (6.28 / fictionCount)
            const mr = 30 + (m % 3) * 6
            const mx = fc.sx + Math.cos(ma) * mr,
              my = fc.sy + Math.sin(ma) * mr * 0.5
            const mtw = 0.5 + 0.5 * Math.sin(now * 2 + m)
            ctx.fillStyle = `rgba(235,225,255,${0.5 * mtw * ep})`
            ctx.beginPath()
            ctx.arc(mx, my, 1.1, 0, 6.28)
            ctx.fill()
          }
          ctx.globalCompositeOperation = "source-over"
          const fcore = ctx.createRadialGradient(fc.sx, fc.sy, 0, fc.sx, fc.sy, 6 * ep + 2)
          fcore.addColorStop(0, `rgba(255,255,255,${0.9 * ep})`)
          fcore.addColorStop(1, `rgba(${fr},${fg},${fb},0)`)
          ctx.fillStyle = fcore
          ctx.beginPath()
          ctx.arc(fc.sx, fc.sy, 6 * ep + 2, 0, 6.28)
          ctx.fill()
          if (fhov) {
            ctx.strokeStyle = `rgba(235,225,255,${0.5 * ep})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(fc.sx, fc.sy, 46, 0, 6.28)
            ctx.stroke()
          }
          if (ep > 0.45) {
            ctx.font = `700 11px ${MONO}`
            ctx.textAlign = "center"
            ctx.fillStyle = `rgba(230,214,255,${0.9 * ep})`
            ctx.fillText("FICTION", fc.sx, fc.sy - 46 * ep - 8)
            ctx.font = `400 9px ${MONO}`
            ctx.fillStyle = `rgba(180,165,220,${0.7 * ep})`
            ctx.fillText(`${fictionCount} STORIES · ENTER →`, fc.sx, fc.sy - 46 * ep + 5)
            ctx.font = `700 11px ${MONO}`
            ctx.fillStyle = `rgba(210,222,255,${0.85 * ep})`
            ctx.fillText("ESSAYS", hubPr.sx, hubPr.sy - 90 * ep - 10)
            ctx.textAlign = "left"
          }
          s._fictionHit = { x: fc.sx, y: fc.sy, r: 48 }
        }
        sys.forEach((pl: SceneOrbit, pi: number) => {
          pl.ang += pl.speed * dt
          const ctr = secCenter(pl)
          const cpr = proj(ctr, s)
          const bob = Math.sin(now * 0.6 + pl.ang * 1.3) * pl.orbitR * 0.18
          const pw = [
            ctr[0] + Math.cos(pl.ang) * pl.orbitR,
            ctr[1] + Math.sin(pl.ang) * pl.orbitR * pl.inc + bob,
            ctr[2] + Math.sin(pl.ang) * pl.orbitR,
          ]
          const pr = proj(pw, s)
          const hovd = s.hoverPlanet === pi
          const rad = Math.max(6, pl.size * pr.scale * 1.9 * (hovd ? 1.25 : 1))
          const ldx = cpr.sx - pr.sx,
            ldy = cpr.sy - pr.sy
          const lm = Math.hypot(ldx, ldy) || 1
          drawOrb(ctx, pr.sx, pr.sy, rad, pl.rgb, { x: ldx / lm, y: ldy / lm }, ep, hovd, now + pl.seed, pl)
          let labelBox: PlanetHit["label"] | undefined
          if (ep > 0.45) {
            const la = Math.min(1, (ep - 0.4) * 2) * (hovd ? 1 : 0.82)
            ctx.font = `${hovd ? 600 : 500} ${hovd ? 12 : 10.5}px ${MONO}`
            ctx.textAlign = "left"
            const labelX = pr.sx + rad * 1.5 + 6
            const labelY = pr.sy + 3
            const labelW = ctx.measureText(pl.work.t).width
            const labelH = hovd ? 14 : 12
            labelBox = { x: labelX - 6, y: labelY - 10, w: labelW + 12, h: labelH + 14 }
            ctx.fillStyle = `rgba(232,242,255,${la})`
            ctx.fillText(pl.work.t, labelX, labelY)
          }
          hits.push({ x: pr.sx, y: pr.sy, r: Math.max(22, rad * 1.65), pi, label: labelBox })
        })
        s._planetHits = hits
        if (ep > 0.4) {
          ctx.font = `700 13px ${MONO}`
          ctx.textAlign = "center"
          ctx.fillStyle = `rgba(255,255,255,${ep * 0.9})`
          ctx.fillText(hub.label, hubPr.sx, hubPr.sy - (hub.shells ? 124 : 84) * ep - 16)
          ctx.textAlign = "left"
        }
      } else {
        s._planetHits = null
        s._fictionHit = null
      }

      // ── warp: actual bending of space — a gravity well lattice + swirl ──
      if (s.warpEnv > 0.02) {
        const we2 = s.warpEnv
        let cx = W / 2,
          cy = H / 2
        if (s.entered >= 0) {
          const hpW = proj(scene.hubs[s.entered].w, s)
          cx = hpW.sx
          cy = hpW.sy
        }
        const hubC = s.entered >= 0 ? scene.hubs[s.entered].c : s.exitHub! >= 0 ? scene.hubs[s.exitHub!].c : "#96aaff"
        const [hr, hg, hb] = hx(hubC)
        const dir = s.exiting ? -1 : 1
        const maxR = Math.hypot(W, H)
        const lensR = (r: number) => r * (1 - 0.42 * we2 * Math.exp(-r / (maxR * 0.22)))
        const swirl = (r: number) => dir * we2 * 1.5 * Math.exp(-r / (maxR * 0.26))
        ctx.globalCompositeOperation = "lighter"
        ctx.lineWidth = 1
        for (let ring = 1; ring <= 11; ring++) {
          const r = (ring / 11) * maxR * 0.62
          const a0 = swirl(r)
          ctx.strokeStyle = `rgba(${hr},${hg},${hb},${we2 * 0.16 * Math.exp(-r / (maxR * 0.5))})`
          ctx.beginPath()
          for (let k = 0; k <= 80; k++) {
            const a = (k / 80) * 6.28 + a0
            const RR = lensR(r)
            const px = cx + Math.cos(a) * RR,
              py = cy + Math.sin(a) * RR
            k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.stroke()
        }
        for (let sp = 0; sp < 28; sp++) {
          const a = (sp / 28) * 6.28
          ctx.strokeStyle = `rgba(${hr},${hg},${hb},${we2 * 0.1})`
          ctx.beginPath()
          for (let k = 0; k <= 26; k++) {
            const r = (k / 26) * maxR * 0.62
            const aw = a + swirl(r)
            const RR = lensR(r)
            const px = cx + Math.cos(aw) * RR,
              py = cy + Math.sin(aw) * RR
            k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
          }
          ctx.stroke()
        }
        const lf = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.22 * we2 + 10)
        lf.addColorStop(0, `rgba(255,255,255,${0.4 * we2})`)
        lf.addColorStop(0.3, `rgba(${hr},${hg},${hb},${0.18 * we2})`)
        lf.addColorStop(1, `rgba(${hr},${hg},${hb},0)`)
        ctx.fillStyle = lf
        ctx.beginPath()
        ctx.arc(cx, cy, maxR * 0.22 * we2 + 10, 0, 6.28)
        ctx.fill()
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * we2})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(cx, cy, 26 + we2 * 30, 0, 6.28)
        ctx.stroke()
        ctx.globalCompositeOperation = "source-over"
      }

      // ── film grain over the whole frame (large tile, single jittered offset) ──
      ctx.globalCompositeOperation = "overlay"
      ctx.globalAlpha = 0.035 + s.enterP * 0.04
      const jx = (Math.random() * GRAIN) | 0,
        jy = (Math.random() * GRAIN) | 0
      for (let yy = -jy; yy < H; yy += GRAIN) for (let xx = -jx; xx < W; xx += GRAIN) ctx.drawImage(grain, xx, yy)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"

      drawGizmo(ctx, W - 58, H - 58, s, proj)
      if (!paused) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // pause the loop when the tab is hidden (battery); resume cleanly on return.
    const onVis = () => {
      if (document.hidden) {
        paused = true
        if (raf) cancelAnimationFrame(raf)
        raf = 0
      } else if (paused) {
        paused = false
        t0 = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }
    document.addEventListener("visibilitychange", onVis)

    // ── interaction ──────────────────────────────────────────────────
    const hitHub = (mx: number, my: number, rad = 30) => {
      const s = st.current
      let best = -1,
        bd = rad
      ;scene.hubs.forEach((h, i) => {
        const pr = proj(h.w, s)
        const d = Math.hypot(pr.sx - mx, pr.sy - my)
        if (d < bd) {
          bd = d
          best = i
        }
      })
      return best
    }
    const enterSystem = (h: number) => {
      const s = st.current
      s.entered = h
      s.focus = h
      s.userZoomed = false
      s.hoverPlanet = -1
      s.warpStart = performance.now() / 1000
      setEntered(h)
      setPanel(null)
    }
    const exitSystem = () => {
      const s = st.current
      s.exitHub = s.entered
      s.exiting = true
      s.exitStart = performance.now() / 1000
      s.entered = -1
      s.focus = -1
      s.userZoomed = false
      s.hoverPlanet = -1
      setEntered(-1)
    }
    const hitPlanet = (mx: number, my: number) => {
      const s = st.current
      if (!s._planetHits) return -1
      let best = -1,
        bd = 999
      s._planetHits.forEach((ph: PlanetHit) => {
        const d = Math.hypot(ph.x - mx, ph.y - my)
        const inBody = d < ph.r
        const inLabel =
          !!ph.label &&
          mx >= ph.label.x &&
          mx <= ph.label.x + ph.label.w &&
          my >= ph.label.y &&
          my <= ph.label.y + ph.label.h
        const rank = inBody ? d : inLabel ? d + 0.01 : 999
        if (rank < bd) {
          bd = rank
          best = ph.pi
        }
      })
      return best
    }
    // shared selection logic for both click and tap (touch uses a larger hub target)
    const activateAt = (mx: number, my: number, hubRad: number) => {
      const s = st.current
      if (s.entered >= 0) {
        const pi = hitPlanet(mx, my)
        if (pi >= 0) {
          const pl = scene.planets[s.entered][pi]
          if (pl.work.kind === "story") setPanel({ type: "fiction" })
          else setPanel({ type: "project", work: pl.work, domain: scene.hubs[s.entered] })
          return
        }
        if (s._fictionHit && Math.hypot(s._fictionHit.x - mx, s._fictionHit.y - my) < s._fictionHit.r) {
          setPanel({ type: "fiction" })
          return
        }
        const h = hitHub(mx, my, hubRad)
        if (h >= 0 && h !== s.entered) {
          if (h === 0) {
            exitSystem()
            setPanel({ type: "about" })
          } else enterSystem(h)
        } else {
          exitSystem()
        }
        return
      }
      const h = hitHub(mx, my, hubRad)
      if (h >= 0) {
        if (h === 0) {
          s.focus = 0
          setInfo(v => ({ ...v, focus: 0 }))
          setPanel({ type: "about" })
        } else enterSystem(h)
      } else {
        s.focus = -1
        setInfo(v => ({ ...v, focus: -1 }))
        setPanel(null)
      }
    }
    const onDown = (e: MouseEvent) => {
      const s = st.current
      s.drag = true
      s.lx = e.clientX
      s.ly = e.clientY
      s.dx0 = e.clientX
      s.dy0 = e.clientY
      s.lastUser = performance.now() / 1000
    }
    const onMove = (e: MouseEvent) => {
      const s = st.current
      const r = cv.getBoundingClientRect()
      const mx = e.clientX - r.left,
        my = e.clientY - r.top
      if (s.drag) {
        const dx = e.clientX - s.lx,
          dy = e.clientY - s.ly
        s.ry += dx * 0.006
        s.rx += dy * 0.006
        s.vry = dx * 0.0006
        s.vrx = dy * 0.0006
        s.lx = e.clientX
        s.ly = e.clientY
        s.lastUser = performance.now() / 1000
      } else {
        if (s.entered >= 0) {
          const pi = hitPlanet(mx, my)
          const fh = s._fictionHit && Math.hypot(s._fictionHit.x - mx, s._fictionHit.y - my) < s._fictionHit.r
          s.hoverFiction = !!fh && pi < 0
          if (pi !== s.hoverPlanet) s.hoverPlanet = pi
          cv.style.cursor = pi >= 0 || s.hoverFiction ? "pointer" : "grab"
        } else {
          const h = hitHub(mx, my)
          if (h !== s.hover) {
            s.hover = h
            setInfo(v => ({ ...v, hover: h }))
            cv.style.cursor = h >= 0 ? "pointer" : "grab"
          }
        }
      }
    }
    const onUp = () => {
      st.current.drag = false
    }
    const onClick = (e: MouseEvent) => {
      const s = st.current
      const r = cv.getBoundingClientRect()
      if (Math.hypot(e.clientX - (s.dx0 || e.clientX), e.clientY - (s.dy0 || e.clientY)) > 5) return // was a drag
      activateAt(e.clientX - r.left, e.clientY - r.top, 30)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const s = st.current
      s.userZoomed = true
      s.zoom = Math.max(0.55, Math.min(2.6, s.zoom * (1 - e.deltaY * 0.0012)))
    }

    // ── touch: 1 finger rotates / taps, 2 fingers pinch-zoom ──
    const touchDist = (t1: Touch, t2: Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
    const onTouchStart = (e: TouchEvent) => {
      const s = st.current
      if (e.touches.length === 1) {
        const t = e.touches[0]
        s.drag = true
        s.lx = t.clientX
        s.ly = t.clientY
        s.tapX = t.clientX
        s.tapY = t.clientY
        s.tapStart = performance.now()
        s.moved = 0
        s.lastUser = performance.now() / 1000
        s.pinchD = 0
      } else if (e.touches.length === 2) {
        s.drag = false
        s.pinchD = touchDist(e.touches[0], e.touches[1])
        s.pinchZoom = s.zoom
        s.userZoomed = true
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      const s = st.current
      e.preventDefault()
      if (e.touches.length === 2 && s.pinchD) {
        const d = touchDist(e.touches[0], e.touches[1])
        s.zoom = Math.max(0.55, Math.min(2.6, s.pinchZoom! * (d / s.pinchD)))
        return
      }
      if (e.touches.length === 1 && s.drag) {
        const t = e.touches[0]
        const dx = t.clientX - s.lx,
          dy = t.clientY - s.ly
        s.ry += dx * 0.006
        s.rx += dy * 0.006
        s.vry = dx * 0.0006
        s.vrx = dy * 0.0006
        s.moved = (s.moved || 0) + Math.abs(dx) + Math.abs(dy)
        s.lx = t.clientX
        s.ly = t.clientY
        s.lastUser = performance.now() / 1000
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      const s = st.current
      s.drag = false
      // a quick, near-stationary touch counts as a tap → select (larger hub target)
      if (e.touches.length === 0 && (s.moved || 0) < 12 && performance.now() - (s.tapStart || 0) < 500) {
        const r = cv.getBoundingClientRect()
        activateAt((s.tapX || 0) - r.left, (s.tapY || 0) - r.top, 44)
      }
      s.pinchD = 0
    }

    cv.addEventListener("mousedown", onDown)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    cv.addEventListener("click", onClick)
    cv.addEventListener("wheel", onWheel, { passive: false })
    cv.addEventListener("touchstart", onTouchStart, { passive: false })
    cv.addEventListener("touchmove", onTouchMove, { passive: false })
    cv.addEventListener("touchend", onTouchEnd)
    cv.style.cursor = "grab"
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack typing: the T / backtick shortcut must not fire while the
      // user is in the terminal input or a form field (contact panel, etc.).
      const tgt = e.target as HTMLElement | null
      const typing =
        !!tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          tgt.isContentEditable)
      if (!typing && (e.key === "`" || e.key === "t" || e.key === "T")) {
        e.preventDefault()
        setTerm(v => !v)
      }
      if (e.key === "Escape") {
        if (panelRef.current) {
          setPanel(null)
        } else if (st.current.entered >= 0) {
          exitSystem()
        } else {
          setTerm(false)
          st.current.focus = -1
          setInfo(v => ({ ...v, focus: -1 }))
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", onVis)
      cv.removeEventListener("mousedown", onDown)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      cv.removeEventListener("click", onClick)
      cv.removeEventListener("wheel", onWheel)
      cv.removeEventListener("touchstart", onTouchStart)
      cv.removeEventListener("touchmove", onTouchMove)
      cv.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetToGalaxy = () => {
    const s = st.current
    if (s.entered >= 0) {
      s.exitHub = s.entered
      s.exiting = true
      s.exitStart = performance.now() / 1000
    }
    setPanel(null)
    s.entered = -1
    s.focus = -1
    s.userZoomed = false
    setEntered(-1)
    setInfo(v => ({ ...v, focus: -1 }))
  }

  return (
    <div
      ref={wrapRef}
      className="atlas-root"
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(130% 100% at 50% 45%, #0a0918 0%, #050509 70%)",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={cvRef}
        role="img"
        aria-label="Interactive galaxy map of Nichalas Barnes' work. Use the menu at the bottom left to open the About, Writing, Changelog, and Contact sections."
        style={{ position: "absolute", inset: 0 }}
      />

      <div style={{ position: "absolute", top: 22, left: 26 }}>
        <TransitionLink
          to="/"
          exit={{ length: 1 }}
          entry={{ length: 1 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontFamily: MONO,
            fontSize: 13,
            letterSpacing: 2,
            color: A.paper,
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            const b = e.currentTarget.querySelector(".wm-back") as HTMLElement | null
            if (b) b.style.opacity = "1"
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            const b = e.currentTarget.querySelector(".wm-back") as HTMLElement | null
            if (b) b.style.opacity = "0.55"
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 99, background: A.cyan, boxShadow: `0 0 10px ${A.cyan}` }} />
          NICHALAS BARNES <span style={{ color: A.fainter }}>– ATLAS</span>
          <span className="wm-back" style={{ color: A.cyan, opacity: 0.55, transition: "opacity 0.2s", fontSize: 11 }}>
            &nbsp; ← HOME
          </span>
        </TransitionLink>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: 1.5,
            color: A.fainter,
            marginTop: 6,
            paddingLeft: 16,
            pointerEvents: "none",
          }}
        >
          every medium, one discipline
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 22,
          right: 26,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: 1.5,
          color: A.fainter,
          pointerEvents: "none",
          textAlign: "right",
        }}
      >
        DRAG <span style={{ color: A.faint }}>– rotate</span>&nbsp;&nbsp;&nbsp;SCROLL{" "}
        <span style={{ color: A.faint }}>– zoom</span>
        <div style={{ marginTop: 6, color: "rgba(140,155,210,0.4)" }}>
          CLICK A CLUSTER · PRESS <span style={{ color: A.faint }}>T</span> FOR TERMINAL
        </div>
      </div>

      <ProjectRail
        domains={domains}
        hidden={entered >= 0 || !!panel}
        onOpen={(work, domain) => setPanel({ type: "project", work, domain })}
      />

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 26,
          display: "flex",
          gap: 22,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: 2,
          fontWeight: 600,
          color: A.fainter,
        }}
      >
        <button type="button" onClick={resetToGalaxy} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.paper, cursor: "pointer" }}>
          WORK
        </button>
        <button type="button" onClick={() => setPanel({ type: "about" })} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.fainter, cursor: "pointer" }}>
          ABOUT
        </button>
        <button type="button" onClick={() => setPanel({ type: "writing" })} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.fainter, cursor: "pointer" }}>
          WRITING
        </button>
        <button type="button" onClick={() => setPanel({ type: "changelog" })} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.fainter, cursor: "pointer" }}>
          CHANGELOG
        </button>
        <button type="button" aria-pressed={term} onClick={() => setTerm(v => !v)} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: term ? A.cyan : A.fainter, cursor: "pointer" }}>
          TERMINAL
        </button>
        <button type="button" onClick={() => setPanel({ type: "contact" })} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.fainter, cursor: "pointer" }}>
          CONTACT
        </button>
      </div>

      {entered >= 0 && (
        <button
          type="button"
          onClick={resetToGalaxy}
          style={{
            position: "absolute",
            top: 72,
            left: 26,
            // sit above the Wraith panel overlay (zIndex 60) so "back to galaxy"
            // is clickable even with a project panel open — resetToGalaxy closes
            // the panel and flies back out in one step
            zIndex: 70,
            pointerEvents: "auto",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: 1.5,
            color: A.cyan,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ← BACK TO GALAXY
        </button>
      )}

      {term && <AtlasTerminal onClose={() => setTerm(false)} />}

      {panel && (
        <AtlasPanelRouter
          {...panel}
          fiction={fiction}
          essays={essays}
          changelog={changelog}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  )
}

function AtlasTerminal({ onClose }: { onClose: () => void }) {
  const CMDS: Record<string, string> = {
    help: "commands: about · work · obsidian · web · games · tools · ai · music · writing · contact · clear",
    about: "Seattle → Berlin → Madrid. Composer turned engineer. The medium changed; the discipline didn't.",
    work: "7 mediums indexed. Drag the atlas, or type a name: web, ai, games, music...",
    obsidian: "Brain Atlas + Cerebro Mycelium. Vault visualizers, live in the community store.",
    web: "Job Toast · Fire Store. Web apps, live and archived.",
    tools: "El Form · Claude Skills · Swash Flag · Bot Battle · Regexplain · Throttle. Libraries, SDKs, and dev tooling.",
    ai: "Cerebro. A native macOS multi-agent workspace orchestrating coding agents.",
    music: "Alex's Hand · 10 years · 10 albums · 12 countries → alexshand.bandcamp.com",
    games: "Knicks Knacks · Sector Zero. Procedural space, co-op in progress.",
    writing: "Agile Anarchy: What's Left. A postmortem on process worship.",
    contact: "open the CONTACT panel (bottom-left) to send a transmission.",
  }
  const QUOTES = [
    "The silence between the notes is where the meaning lives.",
    "Troubleshooting is troubleshooting. The domain is irrelevant.",
    "Arrangement is architecture.",
  ]
  const [lines, setLines] = useState<{ t: string; c: string }[]>(() => [
    { t: "CEREBRO ATLAS // terminal", c: A.cyan },
    { t: QUOTES[Math.floor(Math.random() * QUOTES.length)], c: A.fainter },
    { t: "type 'help' for commands.", c: A.faint },
  ])
  const [val, setVal] = useState("")
  const inRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    inRef.current && inRef.current.focus()
  }, [])
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines])
  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase()
    if (!cmd) return
    if (cmd === "clear") {
      setLines([])
      return
    }
    const out = CMDS[cmd] || `command not found: ${cmd}`
    setLines(l => [
      ...l,
      { t: `nic@atlas:~$ ${raw}`, c: A.paper },
      { t: out, c: CMDS[cmd] ? A.faint : A.pink },
    ])
  }
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%,-50%)",
        width: 560,
        maxWidth: "86%",
        height: 320,
        background: "rgba(6,7,16,0.92)",
        border: "1px solid rgba(72,226,214,0.22)",
        borderRadius: 12,
        boxShadow: "0 0 60px rgba(43,240,255,0.14), inset 0 0 40px rgba(43,240,255,0.03)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 70,
      }}
    >
      <div
        style={{
          height: 34,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          borderBottom: `1px solid ${A.line}`,
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 99, background: A.cyan }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: A.faint, flex: 1 }}>TERMINAL</span>
        <button type="button" aria-label="Close terminal" onClick={onClose} style={{ background: "none", border: "none", padding: 0, fontFamily: MONO, fontSize: 14, color: A.fainter, cursor: "pointer" }}>
          ✕
        </button>
      </div>
      <div
        ref={bodyRef}
        style={{ flex: 1, overflow: "auto", padding: "12px 14px", fontFamily: MONO, fontSize: 12, lineHeight: 1.7 }}
      >
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.c, whiteSpace: "pre-wrap" }}>
            {l.t}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderTop: `1px solid ${A.line}`,
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 12, color: A.cyan }}>nic@atlas:~$</span>
        <input
          ref={inRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              run(val)
              setVal("")
            }
          }}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: A.paper,
            fontFamily: MONO,
            fontSize: 12,
          }}
        />
      </div>
    </div>
  )
}
