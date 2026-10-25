import type { createInput } from "./input"
import { creativeWrap } from "./creativeCarouselMath"

type Carousel = { go(next: number, target: "stories"): void; readonly story: number }

/** Full screen reading for the Creative stories: one dialog, filled from the active story. */
export function createStoryReader(root: HTMLElement, storyCount: number, input: ReturnType<typeof createInput>, carousel: Carousel) {
  const dialog = root.querySelector<HTMLElement>("#story-reader")!
  const page = dialog.querySelector<HTMLElement>("#story-reader-page")!
  const title = dialog.querySelector<HTMLElement>("#story-reader-title")!
  const text = dialog.querySelector<HTMLElement>("#story-reader-text")!
  const num = dialog.querySelector<HTMLElement>("#story-reader-num")!
  const count = dialog.querySelector<HTMLElement>("#story-reader-count")!
  const progress = dialog.querySelector<HTMLElement>(".story-reader-progress")!
  const prev = dialog.querySelector<HTMLButtonElement>("#story-reader-prev")!
  const next = dialog.querySelector<HTMLButtonElement>("#story-reader-next")!
  const close = dialog.querySelector<HTMLButtonElement>("#story-reader-close")!
  const leaves = Array.from(root.querySelectorAll<HTMLElement>("#creative .story-leaf"))
  const announce = root.querySelector<HTMLElement>("#orbit-announce")!
  let open = false
  let opener: HTMLElement | null = null

  function updateProgress() {
    const value = Math.min(100, Math.round(100 * page.scrollTop / Math.max(1, page.scrollHeight - page.clientHeight)))
    progress.setAttribute("aria-valuenow", String(value))
    progress.querySelector<HTMLElement>("span")!.style.width = `${value}%`
  }
  function fill() {
    const leaf = leaves[carousel.story]
    title.textContent = leaf.querySelector("h4")!.textContent
    num.textContent = leaf.querySelector(".story-number")!.textContent
    text.innerHTML = leaf.querySelector(".story-text")!.innerHTML
    count.textContent = `${carousel.story + 1} of ${storyCount}`
    page.scrollTop = 0
    updateProgress()
  }
  function show(from: HTMLElement | null) {
    if (open) return
    open = true
    opener = from
    fill()
    dialog.hidden = false
    dialog.classList.add("on")
    root.classList.add("reading")
    page.focus({ preventScroll: true })
    announce.textContent = `${title.textContent}, full screen. Escape closes.`
  }
  function hide() {
    if (!open) return
    open = false
    dialog.classList.remove("on")
    dialog.hidden = true
    root.classList.remove("reading")
    // stepping may have moved on from the story that opened it: the button to return to is the active story's
    const back = leaves[carousel.story].querySelector<HTMLElement>("[data-story-expand]")
    ;(opener && !opener.closest("[hidden]") ? opener : back)?.focus({ preventScroll: true })
    opener = null
  }
  function step(delta: number) {
    carousel.go(creativeWrap(carousel.story + delta, storyCount), "stories")
    fill()
    page.focus({ preventScroll: true })
    announce.textContent = `${title.textContent}, story ${carousel.story + 1} of ${storyCount}`
  }

  root.querySelectorAll<HTMLButtonElement>("[data-story-expand]").forEach(button => input.listen(button, "click", event => { event.stopPropagation(); show(button) }))
  input.listen(prev, "click", () => step(-1))
  input.listen(next, "click", () => step(1))
  input.listen(close, "click", hide)
  input.listen(page, "scroll", updateProgress, { passive: true })
  // the scene engine listens on the window: nothing in the dialog reaches it
  for (const type of ["click", "pointermove", "touchstart", "touchmove", "touchend"]) input.listen(dialog, type, event => event.stopPropagation(), { passive: type !== "touchmove" })
  input.listen(dialog, "wheel", event => {
    event.stopPropagation()
    // outside the page (the top bar) a wheel would scroll the scene behind
    if (!page.contains(event.target as Node)) event.preventDefault()
  }, { passive: false })
  input.listen(document, "keydown", event => {
    if (!open) return
    const e = event as KeyboardEvent
    e.stopPropagation()
    if (e.key === "Escape") { e.preventDefault(); hide(); return }
    if (e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); step(e.key === "ArrowRight" ? 1 : -1); return }
    if (e.key === "Tab") {
      const stops = [prev, next, close, page].filter(el => !el.hasAttribute("disabled"))
      const at = stops.indexOf(document.activeElement as HTMLElement)
      const to = e.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : (at === stops.length - 1 ? 0 : at + 1)
      e.preventDefault(); stops[to].focus({ preventScroll: true })
    }
  }, true)

  return { open: show, close: hide, step, get isOpen() { return open }, get story() { return carousel.story } }
}
