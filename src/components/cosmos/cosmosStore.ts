/**
 * The cosmos store: the only channel from the WebGL stage to React. The stage
 * writes coarse state (mode, support, entered domain, hover target); React
 * reads it with `useCosmos(selector)`. Per-frame data (label and preview
 * positions) never goes through here; the stage writes those to the DOM.
 */
import { useSyncExternalStore } from "react"

export type CosmosSupport = "unknown" | "ok" | "unsupported" | "lost"
export type CosmosMode = "off" | "idle" | "journey" | "atlas"
export type PickKind = "core" | "domain" | "work" | "fiction"

export interface CosmosTarget {
  kind: PickKind
  id: string
}

export interface CosmosState {
  support: CosmosSupport
  mode: CosmosMode
  /** Seconds into the current journey (0 when not journeying). */
  journeyT: number
  /** Whether the Atlas HUD and site chrome should be visible. */
  hudVisible: boolean
  /** Entered domain id, or null in the galaxy view. */
  entered: string | null
  hover: CosmosTarget | null
  panelOpen: boolean
  viaJourney: boolean
}

const INITIAL: CosmosState = {
  support: "unknown",
  mode: "off",
  journeyT: 0,
  hudVisible: true,
  entered: null,
  hover: null,
  panelOpen: false,
  viaJourney: false,
}

let state: CosmosState = INITIAL
const listeners = new Set<() => void>()

export function getCosmos(): CosmosState {
  return state
}

export function setCosmos(patch: Partial<CosmosState>): void {
  let changed = false
  for (const k of Object.keys(patch) as (keyof CosmosState)[]) {
    if (!Object.is(state[k], patch[k])) {
      changed = true
      break
    }
  }
  if (!changed) return
  state = { ...state, ...patch }
  listeners.forEach((fn) => fn())
}

export function subscribeCosmos(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Subscribe to a slice. Selectors must return primitives or stable references. */
export function useCosmos<T>(selector: (s: CosmosState) => T): T {
  return useSyncExternalStore(
    subscribeCosmos,
    () => selector(state),
    () => selector(INITIAL)
  )
}

const pickListeners = new Set<(t: CosmosTarget) => void>()

/** Clicks on Atlas objects (core, galaxy, project star, fiction knot). */
export function onCosmosPick(fn: (t: CosmosTarget) => void): () => void {
  pickListeners.add(fn)
  return () => {
    pickListeners.delete(fn)
  }
}

export function emitCosmosPick(t: CosmosTarget): void {
  pickListeners.forEach((fn) => fn(t))
}
