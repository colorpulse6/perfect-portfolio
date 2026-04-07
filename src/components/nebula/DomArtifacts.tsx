import React, { useState, useEffect, useCallback, useRef } from "react"
import { navigate } from "gatsby"
import { ARTIFACTS, ArtifactDef } from "./artifacts"
import { useInteractionSounds } from "../audio/useInteractionSounds"

export interface FeaturedEntry {
  title: string
  date: string
  type: "project" | "writing" | "update"
  link: string | null
  status: string | null
  project: string | null
  excerpt: string
  featured: boolean
}

interface DomArtifactsProps {
  onArtifactActivate?: (artifact: ArtifactDef) => void
  featuredEntries?: FeaturedEntry[]
}

interface FloatingIcon {
  kind: "icon"
  artifact: ArtifactDef
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  phase: "shooting" | "materializing" | "floating" | "dissolving" | "hidden"
  phaseTime: number
  bobPhase: number
}

interface FloatingCard {
  kind: "card"
  entry: FeaturedEntry
  id: string
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  phase: "shooting" | "materializing" | "floating" | "dissolving" | "hidden"
  phaseTime: number
  bobPhase: number
}

type FloatingItem = FloatingIcon | FloatingCard

const MAX_ICONS = 3
const ICON_FLOAT_DURATION = 12
const ICON_COOLDOWN = 10000
const MAX_CARDS = 2
const CARD_FLOAT_DURATION = 12
const CARD_COOLDOWN = 5000
const DISSOLVE_DURATION = 2
const MATERIALIZE_DURATION = 1.5

function spawnFromEdge(): { x: number; y: number; vx: number; vy: number } {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200
  const h = typeof window !== "undefined" ? window.innerHeight : 800
  const side = Math.floor(Math.random() * 4)
  let x: number, y: number

  switch (side) {
    case 0: x = -60; y = Math.random() * h; break
    case 1: x = w + 60; y = Math.random() * h; break
    case 2: x = Math.random() * w; y = -60; break
    default: x = Math.random() * w; y = h + 60; break
  }

  const targetX = w * 0.2 + Math.random() * w * 0.6
  const targetY = h * 0.2 + Math.random() * h * 0.6
  const angle = Math.atan2(targetY - y, targetX - x)
  const speed = 300 + Math.random() * 200

  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed }
}

const TYPE_COLORS: Record<string, string> = {
  project: "#5b8def",
  writing: "#d4a053",
  update: "#4aba7a",
}

const STATUS_LABELS: Record<string, string> = {
  "in-progress": "In Progress",
  released: "Released",
  published: "Published",
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

const cardStyle: React.CSSProperties = {
  width: 280,
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  padding: "18px 20px 14px",
  cursor: "pointer",
  transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
  pointerEvents: "auto" as const,
  fontFamily: "-apple-system, 'Segoe UI', sans-serif",
}

function getItemId(item: FloatingItem): string {
  return item.kind === "icon" ? `icon-${item.artifact.id}` : `card-${item.id}`
}

const DomArtifacts: React.FC<DomArtifactsProps> = ({
  onArtifactActivate,
  featuredEntries = [],
}) => {
  const playSound = useInteractionSounds()
  const [items, setItems] = useState<FloatingItem[]>([])
  const cooldowns = useRef<Map<string, number>>(new Map())
  const animRef = useRef<number>(0)
  const lastTime = useRef<number>(0)
  const spawnTimer = useRef<number>(0)
  const cardSpawnTimer = useRef<number>(0)
  const nextIconSpawn = useRef<number>(1 + Math.random() * 3)
  const nextCardSpawn = useRef<number>(2 + Math.random() * 3)

  useEffect(() => {
    const initial: FloatingItem[] = []
    const shuffled = [...ARTIFACTS].sort(() => Math.random() - 0.5)
    for (let i = 0; i < 2; i++) {
      const spawn = spawnFromEdge()
      initial.push({
        kind: "icon",
        artifact: shuffled[i],
        x: spawn.x,
        y: spawn.y,
        vx: spawn.vx,
        vy: spawn.vy,
        opacity: 0,
        phase: "shooting",
        phaseTime: 0,
        bobPhase: Math.random() * Math.PI * 2,
      })
    }
    setItems(initial)
    lastTime.current = performance.now()
  }, [])

  useEffect(() => {
    const animate = (now: number) => {
      const delta = Math.min((now - lastTime.current) / 1000, 0.1)
      lastTime.current = now
      spawnTimer.current += delta
      cardSpawnTimer.current += delta

      setItems((prev) => {
        let updated = prev.map((item) => {
          const next = { ...item }
          next.phaseTime += delta
          next.bobPhase += delta * (next.kind === "card" ? 0.5 : 0.8)

          const isCard = next.kind === "card"
          const floatDuration = isCard ? CARD_FLOAT_DURATION : ICON_FLOAT_DURATION
          const frictionBase = isCard ? 0.015 : 0.03
          const speedThreshold = isCard ? 15 : 20

          switch (next.phase) {
            case "shooting":
              next.x += next.vx * delta
              next.y += next.vy * delta
              const friction = Math.pow(frictionBase, delta)
              next.vx *= friction
              next.vy *= friction
              next.opacity = Math.min(0.7, next.phaseTime / 0.3)
              const speed = Math.sqrt(next.vx * next.vx + next.vy * next.vy)
              if (speed < speedThreshold) {
                next.phase = "materializing"
                next.phaseTime = 0
                const driftScale = isCard ? 0.6 : 1
                next.vx = (Math.random() - 0.5) * 15 * driftScale
                next.vy = (Math.random() - 0.5) * 10 * driftScale
              }
              break
            case "materializing": {
              next.opacity = 0.7 + Math.min(0.3, next.phaseTime / MATERIALIZE_DURATION * 0.3)
              next.x += next.vx * delta
              next.y += next.vy * delta
              const mw = window.innerWidth
              const mh = window.innerHeight
              const mpad = isCard ? 300 : 80
              next.x = Math.max(10, Math.min(next.x, mw - mpad))
              next.y = Math.max(60, Math.min(next.y, mh - 100))
              if (next.phaseTime > MATERIALIZE_DURATION) {
                next.phase = "floating"
                next.phaseTime = 0
                next.opacity = 1
              }
              break
            }
            case "floating": {
              const bobAmp = isCard ? 0.15 : 0.3
              next.x += next.vx * delta
              next.y += next.vy * delta + Math.sin(next.bobPhase) * bobAmp
              const w = window.innerWidth
              const h = window.innerHeight
              const pad = isCard ? 300 : 80
              const minX = 10
              const maxX = w - pad
              const minY = 60
              const maxY = h - 100
              if (next.x < minX) { next.x = minX; next.vx = Math.abs(next.vx) }
              if (next.x > maxX) { next.x = maxX; next.vx = -Math.abs(next.vx) }
              if (next.y < minY) { next.y = minY; next.vy = Math.abs(next.vy) }
              if (next.y > maxY) { next.y = maxY; next.vy = -Math.abs(next.vy) }
              if (next.phaseTime > floatDuration) {
                next.phase = "dissolving"
                next.phaseTime = 0
              }
              break
            }
            case "dissolving": {
              next.opacity = Math.max(0, 1 - next.phaseTime / DISSOLVE_DURATION)
              next.x += next.vx * delta * 0.5
              next.y += next.vy * delta * 0.5
              const cd = next.kind === "card" ? CARD_COOLDOWN : ICON_COOLDOWN
              if (next.phaseTime > DISSOLVE_DURATION) {
                next.phase = "hidden"
                cooldowns.current.set(getItemId(next), Date.now() + cd)
              }
              break
            }
          }
          return next
        })

        updated = updated.filter((i) => i.phase !== "hidden")

        const iconCount = updated.filter((i) => i.kind === "icon").length
        const cardCount = updated.filter((i) => i.kind === "card").length

        if (spawnTimer.current > nextIconSpawn.current && iconCount < MAX_ICONS) {
          spawnTimer.current = 0
          nextIconSpawn.current = 1.5 + Math.random() * 4
          const usedIds = new Set(
            updated.filter((i): i is FloatingIcon => i.kind === "icon").map((i) => i.artifact.id)
          )
          const now = Date.now()
          const available = ARTIFACTS.filter(
            (a) =>
              !usedIds.has(a.id) &&
              (!cooldowns.current.has(`icon-${a.id}`) ||
                now > (cooldowns.current.get(`icon-${a.id}`) ?? 0))
          )
          if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)]
            const spawn = spawnFromEdge()
            updated.push({
              kind: "icon",
              artifact: pick,
              x: spawn.x,
              y: spawn.y,
              vx: spawn.vx,
              vy: spawn.vy,
              opacity: 0,
              phase: "shooting",
              phaseTime: 0,
              bobPhase: Math.random() * Math.PI * 2,
            })
          }
        }

        if (
          cardSpawnTimer.current > nextCardSpawn.current &&
          cardCount < MAX_CARDS &&
          featuredEntries.length > 0
        ) {
          cardSpawnTimer.current = 0
          nextCardSpawn.current = 2 + Math.random() * 4
          const now = Date.now()
          const visibleCardIds = new Set(
            updated.filter((i): i is FloatingCard => i.kind === "card").map((i) => i.id)
          )
          const available = featuredEntries.filter(
            (e) => {
              const cid = `card-${e.title}`
              return (
                !visibleCardIds.has(e.title) &&
                (!cooldowns.current.has(cid) || now > (cooldowns.current.get(cid) ?? 0))
              )
            }
          )
          if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)]
            const spawn = spawnFromEdge()
            updated.push({
              kind: "card",
              entry: pick,
              id: pick.title,
              x: spawn.x,
              y: spawn.y,
              vx: spawn.vx,
              vy: spawn.vy,
              opacity: 0,
              phase: "shooting",
              phaseTime: 0,
              bobPhase: Math.random() * Math.PI * 2,
            })
          }
        }

        return updated
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [featuredEntries])

  const triggerScreenGlitch = useCallback(() => {
    const overlay = document.createElement("div")
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;pointer-events:none;
      mix-blend-mode:exclusion;
    `
    document.body.appendChild(overlay)

    const bars: HTMLDivElement[] = []
    for (let i = 0; i < 12; i++) {
      const bar = document.createElement("div")
      const top = Math.random() * 100
      const height = 1 + Math.random() * 8
      const shift = (Math.random() - 0.5) * 30
      const color = Math.random() > 0.5
        ? `rgba(0,255,220,${0.3 + Math.random() * 0.5})`
        : `rgba(255,50,80,${0.3 + Math.random() * 0.5})`
      bar.style.cssText = `
        position:absolute;top:${top}%;left:0;right:0;height:${height}px;
        background:${color};transform:translateX(${shift}px);
      `
      overlay.appendChild(bar)
      bars.push(bar)
    }

    let frame = 0
    const maxFrames = 18
    const glitchLoop = () => {
      frame++
      bars.forEach((bar) => {
        bar.style.transform = `translateX(${(Math.random() - 0.5) * 40}px)`
        bar.style.opacity = String(Math.random() > 0.3 ? 1 : 0)
        bar.style.top = `${Math.random() * 100}%`
      })
      if (frame < maxFrames) {
        requestAnimationFrame(glitchLoop)
      } else {
        overlay.remove()
      }
    }
    requestAnimationFrame(glitchLoop)
  }, [])

  const handleIconClick = useCallback(
    (icon: FloatingIcon) => {
      if (icon.artifact.id === "waveform") {
        triggerScreenGlitch()
        playSound("glitch")
      } else {
        playSound("click")
      }

      window.dispatchEvent(new CustomEvent("terminal-artifact", { detail: icon.artifact }))
      onArtifactActivate?.(icon.artifact)
      setItems((prev) =>
        prev.map((i) =>
          i.kind === "icon" && i.artifact.id === icon.artifact.id
            ? { ...i, phase: "dissolving" as const, phaseTime: 0 }
            : i
        )
      )
      cooldowns.current.set(`icon-${icon.artifact.id}`, Date.now() + ICON_COOLDOWN)

      const link = icon.artifact.link
      const ext = icon.artifact.externalLink
      if (link) {
        setTimeout(() => navigate(link), 1500)
      } else if (ext) {
        setTimeout(() => window.open(ext, "_blank"), 1500)
      }
    },
    [onArtifactActivate, triggerScreenGlitch, playSound]
  )

  const handleCardClick = useCallback(
    (card: FloatingCard) => {
      const fakeArtifact: ArtifactDef = {
        id: `changelog-${card.entry.title}`,
        iconPaths: [],
        quote: card.entry.excerpt,
        link: null,
        externalLink: null,
        viewBox: "0 0 24 24",
      }
      window.dispatchEvent(new CustomEvent("terminal-artifact", { detail: fakeArtifact }))
      onArtifactActivate?.(fakeArtifact)
      playSound("click")
      setItems((prev) =>
        prev.map((i) =>
          i.kind === "card" && i.id === card.id
            ? { ...i, phase: "dissolving" as const, phaseTime: 0 }
            : i
        )
      )
      cooldowns.current.set(`card-${card.id}`, Date.now() + CARD_COOLDOWN)
    },
    [onArtifactActivate, playSound]
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
      {items
        .filter((i) => i.phase !== "hidden")
        .map((item) => {
          const id = getItemId(item)
          const interactive =
            item.phase !== "hidden" && item.phase !== "dissolving"

          if (item.kind === "icon") {
            return (
              <div
                key={id}
                style={{
                  position: "absolute",
                  left: item.x,
                  top: item.y,
                  opacity: item.opacity,
                  pointerEvents: interactive ? "auto" : "none",
                  transform: `scale(${item.phase === "dissolving" ? 1 + item.phaseTime * 0.5 : 1})`,
                }}
              >
                <div
                  style={glassStyle}
                  onClick={() => handleIconClick(item)}
                  onMouseEnter={(e) => {
                    playSound("hover")
                    const el = e.currentTarget
                    el.style.background = "rgba(255,255,255,0.08)"
                    el.style.borderColor = "rgba(255,255,255,0.2)"
                    el.style.boxShadow = "0 0 40px rgba(140,120,255,0.12)"
                    el.style.transform = "scale(1.12)"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    el.style.background = "rgba(255,255,255,0.05)"
                    el.style.borderColor = "rgba(255,255,255,0.1)"
                    el.style.boxShadow = "none"
                    el.style.transform = "scale(1)"
                  }}
                >
                  <svg
                    viewBox={item.artifact.viewBox}
                    width={24}
                    height={24}
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth={1.5}
                  >
                    {item.artifact.iconPaths.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </svg>
                </div>
              </div>
            )
          }

          const entry = item.entry
          const typeColor = TYPE_COLORS[entry.type] || "#888"

          return (
            <div
              key={id}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                opacity: item.opacity,
                pointerEvents: interactive ? "auto" : "none",
                transform: `scale(${item.phase === "dissolving" ? 1 + item.phaseTime * 0.3 : 1})`,
              }}
            >
              <div
                style={cardStyle}
                onClick={() => handleCardClick(item)}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = "rgba(255,255,255,0.07)"
                  el.style.borderColor = "rgba(255,255,255,0.15)"
                  el.style.boxShadow = "0 0 50px rgba(140,120,255,0.08)"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = "rgba(255,255,255,0.04)"
                  el.style.borderColor = "rgba(255,255,255,0.08)"
                  el.style.boxShadow = "none"
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: typeColor,
                    }}
                  >
                    {entry.type}
                  </span>
                  {entry.status && (
                    <span
                      style={{
                        fontSize: 9,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 4,
                        padding: "2px 6px",
                      }}
                    >
                      {STATUS_LABELS[entry.status] || entry.status}
                    </span>
                  )}
                </div>

                {entry.project && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: 4,
                    }}
                  >
                    {entry.project}
                  </div>
                )}

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "white",
                    lineHeight: 1.3,
                    marginBottom: 6,
                  }}
                >
                  {entry.title}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.5,
                    marginBottom: 14,
                  }}
                >
                  {entry.excerpt.length > 100
                    ? entry.excerpt.slice(0, 100) + "..."
                    : entry.excerpt}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  {entry.link && (
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "rgba(255,255,255,0.8)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(255,255,255,0.5)"
                      }}
                    >
                      {entry.type === "writing" ? "Read" : entry.type === "update" ? "View" : "Play"} &#x2192;
                    </a>
                  )}
                  <a
                    href="/changelog/"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      navigate("/changelog/")
                    }}
                    style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.8)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.5)"
                    }}
                  >
                    Changelog &#x2192;
                  </a>
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}

export default DomArtifacts
