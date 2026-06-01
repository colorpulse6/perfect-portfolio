/**
 * AtlasFog — the cold, spectral atmosphere the wraith panels condense out of.
 * Ported from the prototype's `portfolio-dialog-ghost.jsx`:
 *   - `Mist`     : a drifting cold-fog canvas + a vague breathing "presence".
 *   - `Spectral` : pale glowing text with blurred drifting after-images and a
 *                  faint per-letter waver (used for panel titles).
 * The `G1_Wraith`/`G2_Summoning` design explorations from the prototype are not
 * ported — only the two primitives the panels actually use.
 */
import React from "react"
import { hx, NB_MONO, NB_DISP } from "./atlasShared"

// spectral palette — cold, sickly, otherworldly
export const SPEC = {
  pale: "#cfeaff",
  glow: "#6fd8e0",
  cold: "#3a6f86",
  bruise: "#7d6fb0",
  ink: "#03040a",
} as const

interface MistProps {
  presence?: boolean
  hue?: string
  solid?: boolean
}

// ── Drifting cold mist + forming presence + rising dust (canvas) ──────
export function Mist({ presence = true, hue = SPEC.glow, solid = true }: MistProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const wrap = cv.parentElement
    if (!wrap) return
    let W = 0,
      H = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let raf = 0
    const t0 = performance.now()
    const resize = () => {
      const r = wrap.getBoundingClientRect()
      W = r.width
      H = r.height
      cv.width = W * dpr
      cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const dust = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.3,
      sp: 0.01 + Math.random() * 0.03,
      ph: Math.random() * 6.28,
    }))
    const blobs = [
      { x: 0.3, y: 0.5, r: 380, c: SPEC.cold, sp: 0.05, ph: 0 },
      { x: 0.7, y: 0.45, r: 320, c: SPEC.bruise, sp: 0.04, ph: 2 },
      { x: 0.5, y: 0.7, r: 300, c: SPEC.glow, sp: 0.06, ph: 4 },
      { x: 0.55, y: 0.3, r: 260, c: SPEC.cold, sp: 0.045, ph: 1 },
    ]
    const draw = (t: number) => {
      const now = (t - t0) / 1000
      ctx.clearRect(0, 0, W, H)
      if (solid) {
        ctx.fillStyle = "#03040a"
        ctx.fillRect(0, 0, W, H)
      }
      ctx.globalCompositeOperation = "lighter"
      blobs.forEach(b => {
        const cx = (b.x + Math.sin(now * b.sp + b.ph) * 0.06) * W
        const cy = (b.y + Math.cos(now * b.sp * 0.8 + b.ph) * 0.05) * H
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.4 + b.ph)
        const [r, g, bl] = hx(b.c)
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r * (0.85 + pulse * 0.25))
        gr.addColorStop(0, `rgba(${r},${g},${bl},${0.05 + pulse * 0.04})`)
        gr.addColorStop(0.5, `rgba(${r},${g},${bl},0.02)`)
        gr.addColorStop(1, `rgba(${r},${g},${bl},0)`)
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.arc(cx, cy, b.r, 0, 6.28)
        ctx.fill()
      })
      // the presence — a tall breathing column of vapor, vaguely standing
      if (presence) {
        const px = W * (0.5 + Math.sin(now * 0.13) * 0.04),
          py = H * 0.52
        const breathe = 0.5 + 0.5 * Math.sin(now * 0.5)
        const hgt = H * 0.62,
          wid = 90 + breathe * 40
        const [r, g, bl] = hx(hue)
        const gr = ctx.createRadialGradient(px, py, 0, px, py, hgt)
        gr.addColorStop(0, `rgba(${r},${g},${bl},${0.06 + breathe * 0.05})`)
        gr.addColorStop(0.35, `rgba(${r},${g},${bl},0.03)`)
        gr.addColorStop(1, `rgba(${r},${g},${bl},0)`)
        ctx.save()
        ctx.translate(px, py)
        ctx.scale(wid / hgt, 1)
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.arc(0, 0, hgt, 0, 6.28)
        ctx.fill()
        ctx.restore()
      }
      // rising dust
      dust.forEach(d => {
        d.y -= d.sp * 0.004
        if (d.y < -0.02) {
          d.y = 1.02
          d.x = Math.random()
        }
        const x = (d.x + Math.sin(now * 0.3 + d.ph) * 0.01) * W,
          y = d.y * H
        const a = 0.1 + 0.18 * (0.5 + 0.5 * Math.sin(now * 1.5 + d.ph))
        ctx.fillStyle = `rgba(200,225,255,${a})`
        ctx.beginPath()
        ctx.arc(x, y, d.r, 0, 6.28)
        ctx.fill()
      })
      ctx.globalCompositeOperation = "source-over"
      // dark mist creeping in at edges
      const v = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.2,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.62
      )
      v.addColorStop(0, "rgba(3,4,10,0)")
      v.addColorStop(1, `rgba(2,3,8,${solid ? 0.92 : 0.5})`)
      ctx.fillStyle = v
      ctx.fillRect(0, 0, W, H)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <canvas ref={ref} style={{ position: "absolute", inset: 0 }} />
}

interface SpectralProps {
  text: string
  size: number
  weight?: number
  color?: string
  mono?: boolean
  summon?: boolean
  style?: React.CSSProperties
}

// ── Spectral text: blurred drifting after-images + per-letter waver ──
export function Spectral({
  text,
  size,
  weight = 700,
  color = SPEC.pale,
  mono = false,
  summon = false,
  style = {},
}: SpectralProps) {
  const ff = mono ? NB_MONO : NB_DISP
  const id = React.useId().replace(/:/g, "")
  const letters = [...text]
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      <style>{`
        .sp-${id}{position:relative;display:inline-block;font-family:${ff};font-weight:${weight};font-size:${size}px;letter-spacing:-0.01em;line-height:1.05;}
        .sp-${id} .l{display:inline-block;white-space:pre;color:${color};
          text-shadow:0 0 18px ${color}66, 0 0 42px ${SPEC.glow}40;
          animation:wav-${id} ${3 + (text.length % 3)}s ease-in-out infinite, flk-${id} 7s steps(1) infinite;}
        .sp-${id}.summon .l{opacity:0;filter:blur(8px);animation:sum-${id} .9s forwards, wav-${id} 4s ease-in-out infinite 1s, flk-${id} 7s steps(1) infinite 1s;}
        .sp-${id} .echo{position:absolute;left:0;top:0;color:${SPEC.glow};opacity:.32;filter:blur(7px);
          mix-blend-mode:screen;pointer-events:none;}
        .sp-${id} .echo.b{color:${SPEC.bruise};animation:ech1-${id} 6s ease-in-out infinite;}
        .sp-${id} .echo.c{color:${SPEC.pale};animation:ech2-${id} 5.2s ease-in-out infinite;}
        @keyframes wav-${id}{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
        @keyframes flk-${id}{0%,96%,100%{opacity:1}97%{opacity:.55}98%{opacity:.85}}
        @keyframes sum-${id}{0%{opacity:0;filter:blur(10px);transform:translateY(6px)}100%{opacity:1;filter:blur(0);transform:translateY(0)}}
        @keyframes ech1-${id}{0%,100%{transform:translate(-3px,2px);opacity:.28}50%{transform:translate(4px,-3px);opacity:.4}}
        @keyframes ech2-${id}{0%,100%{transform:translate(3px,-1px);opacity:.22}50%{transform:translate(-4px,3px);opacity:.36}}
      `}</style>
      <span className={`sp-${id}${summon ? " summon" : ""}`}>
        <span className="echo b" aria-hidden="true">
          {text}
        </span>
        <span className="echo c" aria-hidden="true">
          {text}
        </span>
        {letters.map((ch, i) => (
          <span key={i} className="l" style={{ animationDelay: `${i * 0.045}s, ${i * 0.12}s` }}>
            {ch}
          </span>
        ))}
      </span>
    </span>
  )
}
