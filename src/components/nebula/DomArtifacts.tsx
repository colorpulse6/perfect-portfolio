import React, { useState, useEffect, useCallback, useRef } from "react"
import { navigate } from "gatsby"
import { ARTIFACTS, ArtifactDef } from "./artifacts"
import { useInteractionSounds } from "../audio/useInteractionSounds"
import {
  MAX_ICONS,
  ICON_FLOAT_DURATION,
  ICON_COOLDOWN,
  MAX_CARDS,
  CARD_FLOAT_DURATION,
  CARD_COOLDOWN,
  DISSOLVE_DURATION,
} from "./floatingPhysics"
import {
  TYPE_COLORS,
  STATUS_LABELS,
  MEDIA_ASSETS,
  isVideo,
  getCardMediaStyle,
  glassStyle,
  cardStyle,
} from "./cardRendering"
import { findSpot, entryPoint, intersects } from "./placement"
import type { Rect, Spot } from "./placement"

export interface FeaturedEntry {
  title: string
  date: string
  type: "project" | "writing" | "update"
  link: string | null
  status: string | null
  project: string | null
  excerpt: string
  featured: boolean
  media: string | null
  cta: string | null
  secondaryLink: string | null
  secondaryCta: string | null
}

interface DomArtifactsProps {
  onArtifactActivate?: (artifact: ArtifactDef) => void
  featuredEntries?: FeaturedEntry[]
}

/** What React renders: which items exist. Their motion lives in refs. */
type Item =
  | { kind: "icon"; id: string; artifact: ArtifactDef }
  | { kind: "card"; id: string; entry: FeaturedEntry }

interface Body {
  kind: Item["kind"]
  /** measure: rendered hidden to get its size; then enter, float, dissolve. */
  phase: "measure" | "enter" | "float" | "dissolve"
  /** Seconds in the current phase. */
  t: number
  /** Seconds floating; stops while the pointer is on the item. */
  age: number
  from: Spot
  spot: Spot
  w: number
  h: number
  bob: number
  hovered: boolean
}

/** Page elements the floating items keep clear of, by their boxes. */
const BLOCKING = [
  "header .header-container > :first-child > *",
  "header button",
  ".hometex .atlas-enter",
  ".terminal-console",
  ".terminal-collapsed",
  ".audio-toggle",
  ".site-footer",
].join(", ")
/** Text they keep clear of, line by line: the title block's boxes span the full width. */
const BLOCKING_TEXT = ".hometex .title"
const ENTER_DURATION = 1.1
const easeOutCubic = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)
const isExternal = (href: string) => /^https?:\/\//.test(href)

/**
 * The home page's floating artifacts: glass icons and featured changelog
 * cards. Each streaks in from the nearest edge to a spot clear of the title,
 * the call to action, the header and the terminal (measured live), floats
 * there, and fades out. Hovering holds an item in place; nothing covers the
 * content the visitor came for. Motion is written as transforms each frame;
 * React only renders when an item appears or leaves.
 */
const DomArtifacts: React.FC<DomArtifactsProps> = ({
  onArtifactActivate,
  featuredEntries = [],
}) => {
  const playSound = useInteractionSounds()
  const [items, setItems] = useState<Item[]>([])
  const bodies = useRef(new Map<string, Body>())
  const els = useRef(new Map<string, HTMLDivElement>())
  const cooldowns = useRef(new Map<string, number>())
  const entries = useRef(featuredEntries)

  useEffect(() => {
    entries.current = featuredEntries
  }, [featuredEntries])

  const addItem = useCallback((item: Item) => {
    bodies.current.set(item.id, {
      kind: item.kind,
      phase: "measure",
      t: 0,
      age: 0,
      from: { x: 0, y: 0 },
      spot: { x: 0, y: 0 },
      w: 0,
      h: 0,
      bob: Math.random() * Math.PI * 2,
      hovered: false,
    })
    setItems((prev) => [...prev, item])
  }, [])

  const removeItem = useCallback((id: string) => {
    const b = bodies.current.get(id)
    bodies.current.delete(id)
    cooldowns.current.set(id, Date.now() + (b?.kind === "card" ? CARD_COOLDOWN : ICON_COOLDOWN))
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const dissolve = useCallback((id: string) => {
    const b = bodies.current.get(id)
    if (b && b.phase !== "dissolve") {
      b.phase = "dissolve"
      b.t = 0
    }
  }, [])

  const setHovered = useCallback((id: string, on: boolean) => {
    const b = bodies.current.get(id)
    if (b) b.hovered = on
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let last = performance.now()
    let iconTimer = 0
    let cardTimer = 0
    let nextIcon = 0.4
    let nextCard = 2 + Math.random() * 2
    let blocked: Rect[] = []
    let blockedAge = Infinity

    const range = document.createRange()
    const readBlocked = () => {
      const out: Rect[] = []
      const add = (r: DOMRect) => {
        if (r.width > 0 && r.height > 0) out.push({ l: r.left, t: r.top, r: r.right, b: r.bottom })
      }
      document.querySelectorAll<HTMLElement>(BLOCKING).forEach((el) => add(el.getBoundingClientRect()))
      document.querySelectorAll<HTMLElement>(BLOCKING_TEXT).forEach((root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (!n.textContent || !n.textContent.trim()) continue
          range.selectNodeContents(n)
          Array.from(range.getClientRects()).forEach(add)
        }
      })
      blocked = out
      blockedAge = 0
    }
    const otherItems = (except: string) => {
      const out: Rect[] = []
      bodies.current.forEach((b, id) => {
        if (id !== except && b.phase !== "measure") out.push({ l: b.spot.x, t: b.spot.y, r: b.spot.x + b.w, b: b.spot.y + b.h })
      })
      return out
    }
    const ready = (id: string) => !bodies.current.has(id) && (cooldowns.current.get(id) ?? 0) < Date.now()

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      blockedAge += dt
      if (blockedAge > 0.5) readBlocked()
      const viewport = { w: window.innerWidth, h: window.innerHeight }

      let icons = 0
      let cards = 0
      bodies.current.forEach((b) => (b.kind === "icon" ? icons++ : cards++))
      iconTimer += dt
      cardTimer += dt
      if (iconTimer > nextIcon && icons < MAX_ICONS) {
        iconTimer = 0
        nextIcon = 1.5 + Math.random() * 4
        const pool = ARTIFACTS.filter((a) => ready(`icon-${a.id}`))
        if (pool.length > 0) {
          const a = pool[Math.floor(Math.random() * pool.length)]
          addItem({ kind: "icon", id: `icon-${a.id}`, artifact: a })
        }
      }
      if (cardTimer > nextCard && cards < MAX_CARDS && entries.current.length > 0) {
        cardTimer = 0
        nextCard = 2 + Math.random() * 4
        const pool = entries.current.filter((e) => ready(`card-${e.title}`))
        if (pool.length > 0) {
          const e = pool[Math.floor(Math.random() * pool.length)]
          addItem({ kind: "card", id: `card-${e.title}`, entry: e })
        }
      }

      bodies.current.forEach((b, id) => {
        const el = els.current.get(id)
        if (!el) return
        b.t += dt
        if (b.phase === "measure") {
          if (!el.offsetWidth || !el.offsetHeight) return
          b.w = el.offsetWidth
          b.h = el.offsetHeight
          const spot = findSpot(b.w, b.h, viewport, [...blocked, ...otherItems(id)], Math.random, {
            margin: 16,
            gap: b.kind === "card" ? 28 : 14,
          })
          // No room (a phone, a short window): skip this one for now.
          if (!spot) {
            removeItem(id)
            return
          }
          b.spot = spot
          b.from = reduce ? spot : entryPoint(spot, b.w, b.h, viewport)
          b.phase = "enter"
          b.t = 0
          el.style.visibility = "visible"
        }
        let x = b.spot.x
        let y = b.spot.y
        let opacity = 1
        let scale = 1
        if (b.phase === "enter") {
          const k = easeOutCubic(b.t / ENTER_DURATION)
          x = b.from.x + (b.spot.x - b.from.x) * k
          y = b.from.y + (b.spot.y - b.from.y) * k
          opacity = Math.min(1, b.t / 0.5)
          if (b.t >= ENTER_DURATION) {
            b.phase = "float"
            b.t = 0
          }
        } else {
          if (!b.hovered && !reduce) b.bob += dt
          x += Math.sin(b.bob * 0.6) * 6
          y += Math.cos(b.bob * 0.8) * 5
        }
        if (b.phase === "float") {
          if (!b.hovered) b.age += dt
          const life = b.kind === "card" ? CARD_FLOAT_DURATION : ICON_FLOAT_DURATION
          // Leave early when the page needs the space (a resize, the terminal).
          const box = { l: b.spot.x, t: b.spot.y, r: b.spot.x + b.w, b: b.spot.y + b.h }
          const displaced = blockedAge === 0 && (blocked.some((r) => intersects(box, r)) || box.r > viewport.w || box.b > viewport.h)
          if ((b.age > life && !b.hovered) || displaced) {
            b.phase = "dissolve"
            b.t = 0
          }
        } else if (b.phase === "dissolve") {
          const k = b.t / DISSOLVE_DURATION
          opacity = Math.max(0, 1 - k)
          scale = 1 + k * (b.kind === "card" ? 0.3 : 0.5)
          if (b.t >= DISSOLVE_DURATION) {
            removeItem(id)
            return
          }
        }
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`
        el.style.opacity = opacity.toFixed(3)
        el.style.pointerEvents = b.phase === "dissolve" ? "none" : "auto"
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [addItem, removeItem])

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
    (id: string, artifact: ArtifactDef) => {
      if (artifact.id === "waveform") {
        triggerScreenGlitch()
        playSound("glitch")
      } else {
        playSound("click")
      }

      window.dispatchEvent(new CustomEvent("terminal-artifact", { detail: artifact }))
      onArtifactActivate?.(artifact)
      dissolve(id)

      const link = artifact.link
      const ext = artifact.externalLink
      if (link) {
        setTimeout(() => navigate(link), 1500)
      } else if (ext) {
        setTimeout(() => window.open(ext, "_blank"), 1500)
      }
    },
    [onArtifactActivate, triggerScreenGlitch, playSound, dissolve]
  )

  // A card opens what it announces: its main link, else the changelog.
  const handleCardClick = useCallback(
    (entry: FeaturedEntry) => {
      playSound("click")
      const href = entry.link || "/changelog/"
      if (isExternal(href)) window.open(href, "_blank", "noopener,noreferrer")
      else navigate(href)
    },
    [playSound]
  )

  const register = (id: string) => (el: HTMLDivElement | null) => {
    if (el) els.current.set(id, el)
    else els.current.delete(id)
  }

  // Hidden until measured and placed by the frame loop.
  const itemStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    visibility: "hidden",
    opacity: 0,
    transform: "translate3d(-9999px, 0, 0)",
    willChange: "transform, opacity",
    pointerEvents: "none",
  }

  return (
    <div
      data-cosmos-snapshot="2"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        pointerEvents: "none",
      }}
    >
      {items.map((item) => {
          const id = item.id

          if (item.kind === "icon") {
            return (
              <div
                key={id}
                ref={register(id)}
                style={itemStyle}
                onPointerEnter={() => setHovered(id, true)}
                onPointerLeave={() => setHovered(id, false)}
              >
                <div
                  style={glassStyle}
                  onClick={() => handleIconClick(id, item.artifact)}
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
          const link = entry.link
          const typeColor = TYPE_COLORS[entry.type] || "#888"
          const mediaSrc = entry.media ? MEDIA_ASSETS[entry.media] : null
          const ctaLabel =
            entry.cta ||
            (entry.type === "writing" ? "Read" : entry.type === "update" ? "View" : "Play")

          return (
            <div
              key={id}
              ref={register(id)}
              style={itemStyle}
              onPointerEnter={() => setHovered(id, true)}
              onPointerLeave={() => setHovered(id, false)}
            >
              <div
                style={cardStyle}
                onClick={() => handleCardClick(entry)}
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

                {mediaSrc &&
                  (isVideo(mediaSrc) ? (
                    <video
                      src={mediaSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      aria-label={entry.title}
                      style={getCardMediaStyle(entry.media)}
                    />
                  ) : (
                    <img
                      src={mediaSrc}
                      alt={entry.title}
                      style={getCardMediaStyle(entry.media)}
                    />
                  ))}

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
                  {link && (
                    <a
                      href={link}
                      target={isExternal(link) ? "_blank" : undefined}
                      rel={isExternal(link) ? "noopener noreferrer" : undefined}
                      onClick={(e) => {
                        e.stopPropagation()
                        // A site link (the Atlas) stays in this tab.
                        if (!isExternal(link)) {
                          e.preventDefault()
                          navigate(link)
                        }
                      }}
                      style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "rgba(255,255,255,0.8)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(255,255,255,0.5)"
                      }}
                    >
                      {ctaLabel} &#x2192;
                    </a>
                  )}
                  {entry.secondaryLink && (
                    <a
                      href={entry.secondaryLink}
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
                      {entry.secondaryCta || "Site"} &#x2192;
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
