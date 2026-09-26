import React, { useLayoutEffect, useRef } from "react"
import type { AtlasDomain } from "./atlasShared"
import { onStage } from "../cosmos/cosmos"
import type { LabelNode } from "../cosmos/engine/stage"

interface AtlasLabelsProps {
  domains: AtlasDomain[]
  /** Entered domain id: its works get their own labels. */
  entered: string | null
  fictionCount: number
}

const statusText = (s?: string) => (s || "released").replace("-", " ").toUpperCase()

/**
 * DOM labels for the WebGL Atlas. React renders the nodes; the stage places
 * them every frame (outward from the black hole, with a leader line, clamped
 * to the safe area) by writing transforms directly, so no per-frame renders.
 */
export function AtlasLabels({ domains, entered, fictionCount }: AtlasLabelsProps) {
  const coreRef = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<string, LabelNode>())
  const enteredDomain = domains.find((d) => d.id === entered)

  const bind = (key: string, part: "label" | "lead") => (el: HTMLDivElement | null) => {
    const n = nodes.current.get(key) || ({} as LabelNode)
    if (part === "label") {
      if (el) n.label = el
    } else n.lead = el
    if (el) nodes.current.set(key, n)
  }

  useLayoutEffect(() => {
    const domainNodes = new Map<string, LabelNode>()
    const workNodes = new Map<string, LabelNode>()
    nodes.current.forEach((n, key) => {
      if (!n.label || !n.label.isConnected) {
        nodes.current.delete(key)
        return
      }
      if (key.startsWith("d:")) domainNodes.set(key.slice(2), n)
      else if (key.startsWith("w:")) workNodes.set(key.slice(2), n)
    })
    const set = { core: coreRef.current, domains: domainNodes, works: workNodes }
    // On a direct /atlas load this runs before the layout mounts the stage.
    // The unregister only clears this set, so a page instance that is still
    // exiting cannot wipe the labels of the one entering.
    let unregister: (() => void) | null = null
    const unsubscribe = onStage((stage) => {
      unregister?.()
      unregister = stage.registerLabels(set)
    })
    return () => {
      unsubscribe()
      unregister?.()
    }
  }, [entered, domains])

  const core = domains.find((d) => d.core)
  return (
    <div className="cosmos-labels" aria-hidden="true">
      {core && (
        <div ref={coreRef} className="cosmos-lbl cosmos-lbl--core">
          {core.label}
          <small>{(core.tag || "").toUpperCase()}</small>
        </div>
      )}
      {domains
        .filter((d) => !d.core)
        .map((d) => (
          <React.Fragment key={d.id}>
            <div ref={bind(`d:${d.id}`, "lead")} className="cosmos-lead" />
            <div ref={bind(`d:${d.id}`, "label")} className="cosmos-lbl">
              {d.label}
              <small>
                {(d.tag || "").toUpperCase()} · {d.count} {(d.unit || "").toUpperCase()}
              </small>
            </div>
          </React.Fragment>
        ))}
      {enteredDomain &&
        (enteredDomain.works || []).map((w) =>
          w.id ? (
            <React.Fragment key={w.id}>
              <div ref={bind(`w:${w.id}`, "lead")} className="cosmos-lead cosmos-lead--work" />
              <div ref={bind(`w:${w.id}`, "label")} className="cosmos-lbl cosmos-lbl--work">
                {w.t}
                <small>
                  {(w.medium || enteredDomain.label).toUpperCase()} · {statusText(w.status)}
                </small>
              </div>
            </React.Fragment>
          ) : null
        )}
      {enteredDomain && enteredDomain.id === "writing" && fictionCount > 0 && (
        <React.Fragment key="writing:fiction">
          <div ref={bind("w:writing:fiction", "lead")} className="cosmos-lead cosmos-lead--work" />
          <div ref={bind("w:writing:fiction", "label")} className="cosmos-lbl cosmos-lbl--work">
            FICTION
            <small>{fictionCount} STORIES · ENTER</small>
          </div>
        </React.Fragment>
      )}
    </div>
  )
}
