import React, { useState, useEffect, useCallback, useRef } from "react"
import { navigate } from "gatsby"
import { ArtifactDef } from "./artifacts"
import { useInteractionSounds } from "../audio/useInteractionSounds"

interface FloatingPageIconsProps {
  artifacts: ArtifactDef[]
}

interface FloatingIcon {
  artifact: ArtifactDef
  x: number
  y: number
  vx: number
  vy: number
  bobPhase: number
}

const glassStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s, transform 0.3s",
  pointerEvents: "auto" as const,
}

const FloatingPageIcons: React.FC<FloatingPageIconsProps> = ({ artifacts }) => {
  const playSound = useInteractionSounds()
  const [icons, setIcons] = useState<FloatingIcon[]>([])
  const animRef = useRef<number>(0)
  const lastTime = useRef<number>(0)

  useEffect(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200
    const h = typeof window !== "undefined" ? window.innerHeight : 800

    const initial: FloatingIcon[] = artifacts.map((artifact, i) => ({
      artifact,
      x: w * 0.2 + Math.random() * w * 0.6,
      y: h * 0.25 + Math.random() * h * 0.4,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 12,
      bobPhase: i * Math.PI + Math.random() * Math.PI,
    }))

    setIcons(initial)
    lastTime.current = performance.now()
  }, [artifacts])

  useEffect(() => {
    const animate = (now: number) => {
      const delta = Math.min((now - lastTime.current) / 1000, 0.1)
      lastTime.current = now

      setIcons(prev =>
        prev.map(icon => {
          const next = { ...icon }
          next.bobPhase += delta * 0.7

          next.x += next.vx * delta
          next.y += next.vy * delta + Math.sin(next.bobPhase) * 0.25

          // Gentle drift direction change
          next.vx += (Math.random() - 0.5) * 0.3 * delta * 60
          next.vy += (Math.random() - 0.5) * 0.2 * delta * 60

          // Clamp speed
          const speed = Math.sqrt(next.vx * next.vx + next.vy * next.vy)
          if (speed > 20) {
            next.vx *= 20 / speed
            next.vy *= 20 / speed
          }
          if (speed < 3) {
            next.vx *= 3 / speed
            next.vy *= 3 / speed
          }

          const w = window.innerWidth
          const h = window.innerHeight
          const pad = 80

          if (next.x < 10) { next.x = 10; next.vx = Math.abs(next.vx) * 0.8 }
          if (next.x > w - pad) { next.x = w - pad; next.vx = -Math.abs(next.vx) * 0.8 }
          if (next.y < 60) { next.y = 60; next.vy = Math.abs(next.vy) * 0.8 }
          if (next.y > h - 100) { next.y = h - 100; next.vy = -Math.abs(next.vy) * 0.8 }

          return next
        })
      )

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const handleClick = useCallback(
    (artifact: ArtifactDef) => {
      playSound("click")
      window.dispatchEvent(
        new CustomEvent("terminal-artifact", { detail: artifact })
      )

      if (artifact.link) {
        setTimeout(() => navigate(artifact.link!), 1500)
      } else if (artifact.externalLink) {
        setTimeout(() => window.open(artifact.externalLink!, "_blank"), 1500)
      }
    },
    [playSound]
  )

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        pointerEvents: "none",
      }}
    >
      {icons.map(icon => (
        <div
          key={icon.artifact.id}
          style={{
            position: "absolute",
            left: icon.x,
            top: icon.y,
            opacity: 1,
            pointerEvents: "auto",
          }}
        >
          <div
            style={glassStyle}
            onClick={() => handleClick(icon.artifact)}
            onMouseEnter={e => {
              playSound("hover")
              const el = e.currentTarget
              el.style.background = "rgba(255,255,255,0.08)"
              el.style.borderColor = "rgba(255,255,255,0.2)"
              el.style.boxShadow = "0 0 40px rgba(140,120,255,0.12)"
              el.style.transform = "scale(1.12)"
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = "rgba(255,255,255,0.05)"
              el.style.borderColor = "rgba(255,255,255,0.1)"
              el.style.boxShadow = "none"
              el.style.transform = "scale(1)"
            }}
          >
            <svg
              viewBox={icon.artifact.viewBox}
              width={24}
              height={24}
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1.5}
            >
              {icon.artifact.iconPaths.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </svg>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 6,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              fontFamily: "-apple-system, 'Segoe UI', sans-serif",
              pointerEvents: "none",
            }}
          >
            {icon.artifact.id}
          </div>
        </div>
      ))}
    </div>
  )
}

export default FloatingPageIcons
