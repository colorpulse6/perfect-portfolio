import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { NB as A, NB_MONO as MONO } from "./atlasShared"
import type { AtlasDomain, AtlasWork } from "./atlasShared"
import type { AtlasModel } from "./buildAtlasModel"
import type { AtlasPanelState } from "./AtlasPanels"
import { AtlasHud } from "./AtlasHud"
import { AtlasLabels } from "./AtlasLabels"
import { AtlasPreviewCard } from "./AtlasPreviewCard"
import { AtlasA11yNav } from "./AtlasA11yNav"
import { getStage } from "../cosmos/cosmos"
import { getCosmos, onCosmosPick, useCosmos } from "../cosmos/cosmosStore"

interface CosmosAtlasProps {
  model: AtlasModel
}

/**
 * The WebGL Atlas: the cosmos stage renders the galaxy behind this view; this
 * view owns the React HUD (shared with the classic Atlas), labels, the hover
 * preview and the accessible navigation, and routes clicks on galaxy objects
 * to the existing panels.
 */
export function CosmosAtlas({ model }: CosmosAtlasProps) {
  const { domains, fiction, essays, changelog } = model
  const [panel, setPanelState] = useState<AtlasPanelState | null>(null)
  const [term, setTerm] = useState(false)
  const entered = useCosmos((s) => s.entered)
  const panelRef = useRef(false)

  const workIndex = useMemo(() => {
    const m = new Map<string, { work: AtlasWork; domain: AtlasDomain }>()
    domains.forEach((d) => (d.works || []).forEach((w) => w.id && m.set(w.id, { work: w, domain: d })))
    return m
  }, [domains])

  const setPanel = useCallback((p: AtlasPanelState | null) => {
    panelRef.current = !!p
    setPanelState(p)
    getStage()?.setPanelOpen(!!p)
  }, [])

  useEffect(
    () =>
      onCosmosPick((t) => {
        if (t.kind === "core") setPanel({ type: "about" })
        else if (t.kind === "fiction") setPanel({ type: "fiction" })
        else if (t.kind === "work") {
          const hit = workIndex.get(t.id)
          if (!hit) return
          setPanel(hit.work.kind === "story" ? { type: "fiction" } : { type: "project", work: hit.work, domain: hit.domain })
        }
      }),
    [workIndex, setPanel]
  )

  // Escape closes a panel, then leaves the galaxy, then the terminal. T toggles
  // the terminal unless the visitor is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null
      const typing =
        !!tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.tagName === "SELECT" || tgt.isContentEditable)
      const plain = !e.ctrlKey && !e.metaKey && !e.altKey
      if (!typing && plain && (e.key === "`" || e.key === "t" || e.key === "T")) {
        e.preventDefault()
        setTerm((v) => !v)
      }
      if (e.key === "Escape") {
        if (panelRef.current) setPanel(null)
        else if (getCosmos().entered) getStage()?.exitDomain()
        else setTerm(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setPanel])

  useEffect(() => () => getStage()?.setPanelOpen(false), [])

  const resetGalaxy = useCallback(() => {
    setPanel(null)
    getStage()?.resetView()
  }, [setPanel])

  return (
    <>
      <h1 className="sr-only">Atlas of Nichalas Barnes' work</h1>
      <AtlasLabels domains={domains} entered={entered} fictionCount={fiction.length} />
      <AtlasPreviewCard workIndex={workIndex} fictionCount={fiction.length} />
      <AtlasHud
        domains={domains}
        fiction={fiction}
        essays={essays}
        changelog={changelog}
        entered={!!entered}
        panel={panel}
        setPanel={setPanel}
        term={term}
        setTerm={setTerm}
        onResetGalaxy={resetGalaxy}
        hints={
          <div
            style={{
              position: "absolute",
              top: 22,
              // clear of the site menu button in the top-right corner
              right: 84,
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: 1.5,
              color: A.fainter,
              pointerEvents: "none",
              textAlign: "right",
            }}
            className="cosmos-hints"
            data-cosmos-avoid=""
          >
            DRAG <span style={{ color: A.faint }}>– rotate</span>&nbsp;&nbsp;&nbsp;SCROLL <span style={{ color: A.faint }}>– zoom</span>
            <div style={{ marginTop: 6, color: "rgba(140,155,210,0.4)" }}>
              CLICK A GALAXY · PRESS <span style={{ color: A.faint }}>T</span> FOR TERMINAL
            </div>
          </div>
        }
      />
      <AtlasA11yNav domains={domains} entered={entered} fictionCount={fiction.length} setPanel={setPanel} />
    </>
  )
}
