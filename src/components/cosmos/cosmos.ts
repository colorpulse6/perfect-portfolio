/**
 * The page-facing handle to the one cosmos stage the layout mounts. Pages call
 * `getStage()` for commands (enter a galaxy, start the journey); it is null
 * during SSR and before the stage mounts. Registrations that must survive a
 * late mount (labels, the preview card) use `onStage()` instead.
 */
import type { Stage } from "./engine/stage"

let current: Stage | null = null
const listeners = new Set<(stage: Stage) => void>()

export function getStage(): Stage | null {
  return current
}

export function setStage(stage: Stage | null): void {
  current = stage
  if (stage) listeners.forEach((fn) => fn(stage))
}

/**
 * Calls `fn` with the stage now if it exists, and again whenever a new stage
 * mounts. Returns the unsubscribe function, so an effect can return it and
 * the latest registration always wins.
 */
export function onStage(fn: (stage: Stage) => void): () => void {
  listeners.add(fn)
  if (current) fn(current)
  return () => {
    listeners.delete(fn)
  }
}
