import React from "react"
import type { AtlasDomain, AtlasWork } from "./atlasShared"
import type { AtlasPanelState } from "./AtlasPanels"
import { getStage } from "../cosmos/cosmos"

interface AtlasA11yNavProps {
  domains: AtlasDomain[]
  entered: string | null
  fictionCount: number
  setPanel: (panel: AtlasPanelState | null) => void
}

/**
 * Keyboard and screen-reader route through the Atlas. Visually hidden until
 * it receives focus; every button runs the same action as clicking the
 * matching object in the galaxy.
 */
export function AtlasA11yNav({ domains, entered, fictionCount, setPanel }: AtlasA11yNavProps) {
  const openWork = (work: AtlasWork, domain: AtlasDomain) =>
    setPanel(work.kind === "story" ? { type: "fiction" } : { type: "project", work, domain })
  return (
    <nav className="atlas-a11y atlas-hud-live" aria-label="Atlas galaxies and work">
      <ul>
        {domains.map((d) =>
          d.core ? (
            <li key={d.id}>
              <button type="button" onClick={() => setPanel({ type: "about" })}>
                {d.label}: about
              </button>
            </li>
          ) : (
            <li key={d.id}>
              <button
                type="button"
                aria-expanded={entered === d.id}
                onClick={() => (entered === d.id ? getStage()?.exitDomain() : getStage()?.enterDomain(d.id))}
              >
                {d.label}: {d.tag}, {d.count} {d.unit}
              </button>
              {entered === d.id && (
                <ul>
                  {(d.works || []).map((w) => (
                    <li key={w.id || w.t}>
                      <button type="button" onClick={() => openWork(w, d)}>
                        {w.t}
                        {w.status ? `, ${w.status.replace("-", " ")}` : ""}
                      </button>
                    </li>
                  ))}
                  {d.id === "writing" && fictionCount > 0 && (
                    <li>
                      <button type="button" onClick={() => setPanel({ type: "fiction" })}>
                        Fiction, {fictionCount} stories
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </li>
          )
        )}
      </ul>
    </nav>
  )
}
