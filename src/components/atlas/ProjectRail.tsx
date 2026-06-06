import React from "react"
import type { AtlasDomain, AtlasWork } from "./atlasShared"
import { isVideo } from "../../helpers/projectImages"
import { WSPEC, WSTAT } from "./panels/styles"
import "./projectRail.css"

// A slow, continuously-scrolling vertical rail of project cards pinned to the
// left of the atlas. Built straight from the galaxy's `domains` (so it stays in
// sync with no second list). Clicking a card opens that project's Wraith panel.

const PROJECT_RAIL_DOMAIN_IDS = new Set(["obsidian", "web", "games", "tools", "ai", "sites"])

interface RailItem {
  work: AtlasWork
  domain: AtlasDomain
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduce
}

export function ProjectRail({
  domains,
  onOpen,
  hidden = false,
}: {
  domains: AtlasDomain[]
  onOpen: (work: AtlasWork, domain: AtlasDomain) => void
  hidden?: boolean
}) {
  const reduce = usePrefersReducedMotion()
  const [hovering, setManual] = React.useState(false)

  const items = React.useMemo<RailItem[]>(
    () =>
      domains.flatMap(domain => {
        if (!PROJECT_RAIL_DOMAIN_IDS.has(domain.id)) return []
        return (domain.works || []).map(work => ({ work, domain }))
      }),
    [domains],
  )

  if (hidden || items.length === 0) return null

  // Duplicate the list so the translateY(-50%) loop is seamless. With reduced
  // motion or hover/manual scroll, render the list only once.
  const manual = reduce || hovering
  const rendered = manual ? items : [...items, ...items]

  return (
    <div
      className={`atlas-rail${manual ? " atlas-rail--manual" : ""}`}
      aria-label="All projects"
      onMouseEnter={() => setManual(true)}
      onMouseLeave={() => setManual(false)}
    >
      <span className="atlas-rail__eyebrow">All work</span>
      <div className="atlas-rail__track">
        {rendered.map((it, i) => {
          const c = it.domain.c
          const media = it.work.media
          const status = it.work.status || "released"
          const dot = WSTAT[status] || WSPEC.glow
          const sub = [it.work.medium, status].filter(Boolean).join(" · ")
          return (
            <button
              key={`${it.work.t}-${i}`}
              type="button"
              className="atlas-rail__card"
              onClick={() => onOpen(it.work, it.domain)}
              aria-label={`Open ${it.work.t}`}
              tabIndex={i < items.length ? 0 : -1}
            >
              <span
                className="atlas-rail__thumb"
                style={{
                  background: `radial-gradient(120% 120% at 30% 25%, ${c}, ${c}22 70%), #0a0e16`,
                }}
                aria-hidden="true"
              >
                {media ? (
                  isVideo(media) ? (
                    <video
                      className="atlas-rail__media"
                      src={media}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img className="atlas-rail__media" src={media} alt={``} loading="lazy" />
                  )
                ) : (
                  <span className="atlas-rail__thumb-fallback" />
                )}
              </span>
              <span className="atlas-rail__meta">
                <span className="atlas-rail__nm">{it.work.t}</span>
                <span className="atlas-rail__sub">
                  <span className="d" style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} />
                  <span className="atlas-rail__sub-text">{sub}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
