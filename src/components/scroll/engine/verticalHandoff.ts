import type { createInput } from "./input"

export function attachVerticalHandoff(root: HTMLElement, selector: string, input: ReturnType<typeof createInput>, active: () => boolean) {
  const region = root.querySelector<HTMLElement>(selector)!
  let phase: "idle" | "held" | "released" = "idle"
  let last = -Infinity
  input.listen(region, "wheel", event => {
    const e = event as WheelEvent
    if (!active() || e.defaultPrevented || Math.abs(e.deltaY) < 1 || Math.abs(e.deltaX) > Math.abs(e.deltaY) / 1.5) return
    const scroll = (e.target as HTMLElement).closest<HTMLElement>(".essay-spread, .story-text, .story-index")
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1)
    const room = scroll && (dy > 0 ? scroll.scrollTop + scroll.clientHeight < scroll.scrollHeight - 1 : scroll.scrollTop > 1)
    const now = performance.now()
    if (room) { phase = "held"; last = now; return }
    if (now - last > 350) {
      if (phase === "held") { phase = "released"; last = now; return }
      phase = "held"
    }
    last = now
    if (phase === "held") e.preventDefault()
  }, { passive: false })
}
