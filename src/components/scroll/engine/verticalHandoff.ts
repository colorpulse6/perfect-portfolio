import type { createInput } from "./input"

/** How long a trackpad's momentum is kept on a text that has just run out of room. */
export const HOLD_MS = 350

/**
 * When the page may take a vertical wheel from a reading area. The text keeps the wheel
 * while it can scroll. For HOLD_MS after it runs out, the wheel is held so the momentum
 * ends on the last line. After that, and over anything that cannot scroll at all, the
 * page takes it: a continuous wheel never stays held.
 */
export function createHandoff() {
  let lastRoom = -Infinity
  return {
    holds({ room, scrollable, now }: { room: boolean; scrollable: boolean; now: number }) {
      if (room) { lastRoom = now; return false }
      return scrollable && now - lastRoom < HOLD_MS
    },
  }
}

export function attachVerticalHandoff(root: HTMLElement, selector: string, input: ReturnType<typeof createInput>, active: () => boolean) {
  const region = root.querySelector<HTMLElement>(selector)!
  const handoff = createHandoff()
  input.listen(region, "wheel", event => {
    const e = event as WheelEvent
    if (!active() || e.defaultPrevented || Math.abs(e.deltaY) < 1 || Math.abs(e.deltaX) > Math.abs(e.deltaY) / 1.5) return
    const scroll = (e.target as HTMLElement).closest<HTMLElement>(".essay-spread, .story-text, .story-index")
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1)
    const scrollable = !!scroll && scroll.scrollHeight > scroll.clientHeight + 1
    const room = scrollable && (dy > 0 ? scroll!.scrollTop + scroll!.clientHeight < scroll!.scrollHeight - 1 : scroll!.scrollTop > 1)
    if (handoff.holds({ room, scrollable, now: performance.now() })) e.preventDefault()
  }, { passive: false })
}
