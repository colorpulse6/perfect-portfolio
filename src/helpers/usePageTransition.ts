import { useEffect } from "react"
import gsap from "gsap"

interface PageTransitionDurations {
  /** Fade-in duration when the route is entering. */
  enter?: number
  /** Fade-out duration when the route is exiting. */
  exit?: number
  /** Fade-in duration on initial mount. */
  mount?: number
  /**
   * Run the fade-in (mount and entering). False when something else reveals
   * the page, such as the Atlas after the wormhole journey.
   */
  intro?: boolean
}

/**
 * Drives the standard gatsby-plugin-transition-link fade for a page container:
 * fade in on mount and when entering, fade out when exiting. The selector and
 * durations are per-page so every route keeps its exact feel. Page-specific
 * animations (hyperspace dive, story reader, etc.) stay at the call site.
 */
export function usePageTransition(
  transitionStatus: string | undefined,
  selector: string,
  { enter = 1, exit = 0.4, mount = 1, intro = true }: PageTransitionDurations = {}
): void {
  useEffect(() => {
    if (transitionStatus === "entering" && intro) {
      gsap.to(selector, { autoAlpha: 1, duration: enter })
    }
    if (transitionStatus === "exiting") {
      gsap.to(selector, { autoAlpha: 0, duration: exit })
    }
  }, [transitionStatus, selector, enter, exit, intro])

  useEffect(() => {
    if (intro) gsap.to(selector, { autoAlpha: 1, duration: mount })
  }, [selector, mount, intro])
}
