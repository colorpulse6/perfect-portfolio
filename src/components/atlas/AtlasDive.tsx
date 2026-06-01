/**
 * AtlasDive — the home → atlas "hyperspace dive". A lightweight full-screen 2D
 * canvas overlay (ported from the prototype's `Home Entry.html`): the nebula
 * particles streak inward, a flash blooms, then we navigate to /atlas (which
 * mounts on black, so the cut is seamless). Reduced motion skips the streaks
 * and navigates almost immediately.
 */
import React, { useEffect, useRef } from "react"
import { navigate } from "gatsby"

const TAU = Math.PI * 2
const COLS = [
  [120, 140, 255],
  [170, 120, 255],
  [90, 210, 235],
  [210, 180, 255],
]

export default function AtlasDive() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    let W = 0,
      H = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      cv.width = W * dpr
      cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const N = 460
    const stars = Array.from({ length: N }, () => {
      const z = Math.random() * 1 + 0.2
      return {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z,
        c: COLS[(Math.random() * COLS.length) | 0],
        r: Math.random() * 1.4 + 0.3,
        tw: Math.random() * TAU,
      }
    })
    const blobs = [
      { x: 0.28, y: 0.4, c: [90, 90, 200], r: 380 },
      { x: 0.74, y: 0.34, c: [150, 90, 220], r: 320 },
      { x: 0.55, y: 0.7, c: [60, 190, 210], r: 300 },
      { x: 0.4, y: 0.62, c: [120, 80, 210], r: 260 },
    ]
    let warp = 0
    const warping = !reduce // reduced motion → no inward streaks
    const t0 = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const t = (now - t0) / 1000
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = "#050509"
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = "lighter"
      for (const b of blobs) {
        const cx = (b.x + Math.sin(t * 0.05 + b.x) * 0.02) * W,
          cy = (b.y + Math.cos(t * 0.04 + b.y) * 0.02) * H
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.3 + b.x * 5)
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r * (0.9 + warp * 0.4))
        g.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${(0.05 + pulse * 0.03) * (1 + warp)})`)
        g.addColorStop(0.5, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0.015)`)
        g.addColorStop(1, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, b.r, 0, TAU)
        ctx.fill()
      }
      if (warping) warp = Math.min(1.6, warp + 0.02)
      const cx = W / 2,
        cy = H / 2
      for (const s of stars) {
        if (warping) {
          s.z -= 0.012
          if (s.z < 0.05) {
            s.z = 1.2
            s.x = Math.random() * 2 - 1
            s.y = Math.random() * 2 - 1
          }
        }
        const persp = 0.6 / s.z
        const px = cx + s.x * W * 0.62 * persp,
          py = cy + s.y * H * 0.62 * persp
        const tw = 0.5 + 0.5 * Math.sin(t * 1.5 + s.tw)
        const a = Math.min(1, (0.25 + tw * 0.4) * persp) * (warping ? 1 : 0.9)
        const rad = s.r * persp * (1 + warp * 1.5)
        if (warp > 0.05) {
          const sx = cx + s.x * W * 0.62 * (0.6 / (s.z + 0.05 * warp)),
            sy = cy + s.y * H * 0.62 * (0.6 / (s.z + 0.05 * warp))
          ctx.strokeStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${a * 0.8})`
          ctx.lineWidth = rad
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.lineTo(px, py)
          ctx.stroke()
        } else {
          ctx.fillStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${a})`
          ctx.beginPath()
          ctx.arc(px, py, rad, 0, TAU)
          ctx.fill()
        }
      }
      ctx.globalCompositeOperation = "source-over"
      const v = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.25, cx, cy, Math.max(W, H) * 0.7)
      v.addColorStop(0, "rgba(5,5,9,0)")
      v.addColorStop(1, `rgba(3,3,8,${0.85 - warp * 0.3})`)
      ctx.fillStyle = v
      ctx.fillRect(0, 0, W, H)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const flashT = window.setTimeout(
      () => {
        if (flashRef.current) {
          flashRef.current.style.transition = "opacity .55s"
          flashRef.current.style.opacity = "0.95"
        }
      },
      reduce ? 120 : 650
    )
    const navT = window.setTimeout(() => navigate("/atlas"), reduce ? 320 : 1150)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      clearTimeout(flashT)
      clearTimeout(navT)
    }
  }, [])

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}>
      <canvas ref={cvRef} style={{ position: "fixed", inset: 0, display: "block" }} />
      <div
        ref={flashRef}
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 50% 50%, #cfe9ff 0%, #6f7dff 30%, transparent 70%)",
          opacity: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />
    </div>
  )
}
