/**
 * The page-facing handle to the one cosmos stage the layout mounts. Pages call
 * `getStage()` for commands (enter a galaxy, start the journey); it is null
 * during SSR and before the stage mounts.
 */
import type { Stage } from "./engine/stage"

let current: Stage | null = null

export function getStage(): Stage | null {
  return current
}

export function setStage(stage: Stage | null): void {
  current = stage
}
