/**
 * The Atlas HUD: wordmark and home link, interaction hints, project rail,
 * bottom navigation, back-to-galaxy, terminal and panel router. Presentational:
 * both the WebGL Atlas and the classic Canvas2D Atlas render it with their own
 * state.
 */
import React from "react"
import TransitionLink from "gatsby-plugin-transition-link"
import { NB as A, NB_MONO as MONO } from "./atlasShared"
import type { AtlasDomain, FictionStory, EssayItem, ChangelogItem } from "./atlasShared"
import { AtlasPanelRouter } from "./AtlasPanels"
import type { AtlasPanelState } from "./AtlasPanels"
import { ProjectRail } from "./ProjectRail"
import { AtlasTerminal } from "./AtlasTerminal"

export interface AtlasHudProps {
  domains: AtlasDomain[]
  fiction: FictionStory[]
  essays: EssayItem[]
  changelog: ChangelogItem[]
  /** A galaxy (cluster) is entered: shows BACK TO GALAXY and hides the rail. */
  entered: boolean
  panel: AtlasPanelState | null
  setPanel: (panel: AtlasPanelState | null) => void
  term: boolean
  setTerm: React.Dispatch<React.SetStateAction<boolean>>
  onResetGalaxy: () => void
  /** Replaces the default top-right interaction hints. */
  hints?: React.ReactNode
}

export function AtlasHud({
  domains,
  fiction,
  essays,
  changelog,
  entered,
  panel,
  setPanel,
  term,
  setTerm,
  onResetGalaxy,
  hints,
}: AtlasHudProps) {
  return (
    <>
      <div data-cosmos-avoid="" style={{ position: "absolute", top: 22, left: 26, zIndex: 70 }}>
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
            if (b) b.style.opacity = "0.9"
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 99, background: A.cyan, boxShadow: `0 0 10px ${A.cyan}` }} />
          NICHALAS BARNES <span style={{ color: A.fainter }}>– ATLAS</span>
          <span className="wm-back" style={{ color: A.cyan, opacity: 0.9, transition: "opacity 0.2s", fontSize: 11, fontWeight: 700 }}>
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

      {hints ?? (
        <div
          className="cosmos-hints"
          data-cosmos-avoid=""
          style={{
            position: "absolute",
            // below the header's "Work with me" link, clear of the site
            // menu button in the top-right corner
            top: 92,
            right: 84,
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
      )}

      <ProjectRail
        domains={domains}
        hidden={entered || !!panel}
        onOpen={(work, domain) => setPanel({ type: "project", work, domain })}
      />

      <div
        data-cosmos-avoid=""
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
        <button type="button" onClick={onResetGalaxy} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.paper, cursor: "pointer" }}>
          WORK
        </button>
        <button type="button" onClick={() => setPanel({ type: "about" })} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.faint, cursor: "pointer" }}>
          ABOUT
        </button>
        <button type="button" onClick={() => setPanel({ type: "writing" })} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.faint, cursor: "pointer" }}>
          WRITING
        </button>
        <button type="button" onClick={() => setPanel({ type: "changelog" })} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.faint, cursor: "pointer" }}>
          CHANGELOG
        </button>
        <button type="button" aria-pressed={term} onClick={() => setTerm(v => !v)} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: term ? A.cyan : A.faint, cursor: "pointer" }}>
          TERMINAL
        </button>
        <button type="button" onClick={() => setPanel({ type: "contact" })} style={{ background: "none", border: "none", padding: 0, font: "inherit", letterSpacing: "inherit", color: A.faint, cursor: "pointer" }}>
          CONTACT
        </button>
      </div>

      {entered && (
        <button
          type="button"
          data-cosmos-avoid=""
          onClick={onResetGalaxy}
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

      <div className="atlas-hud-live">{term && <AtlasTerminal onClose={() => setTerm(false)} />}</div>

      <div className="atlas-hud-live">
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
    </>
  )
}
