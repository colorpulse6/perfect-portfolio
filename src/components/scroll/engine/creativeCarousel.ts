import { RELEASES } from "../data/content"
import type { createInput } from "./input"
import { creativeWrap, recordGeometry, storyGeometry } from "./creativeCarouselMath"

type World = "stories" | "music"
export function createCreativeCarousel(root: HTMLElement, storyCount: number, input: ReturnType<typeof createInput>, active: () => boolean, reduced: () => boolean) {
  const creative = root.querySelector<HTMLElement>("#creative")!
  const storyStage = creative.querySelector<HTMLElement>(".story-stage")!
  const recordStage = creative.querySelector<HTMLElement>(".record-stage")!
  const planet = creative.querySelector<HTMLElement>(".story-planet")!
  const tabs = Array.from(creative.querySelectorAll<HTMLButtonElement>("[data-creative-world]"))
  const worlds = { stories: creative.querySelector<HTMLElement>("#creative-stories")!, music: creative.querySelector<HTMLElement>("#creative-music")! }
  const beads = Array.from(creative.querySelectorAll<HTMLButtonElement>(".story-bead"))
  const discs = Array.from(creative.querySelectorAll<HTMLButtonElement>(".record-disc"))
  const storyLeaves = Array.from(creative.querySelectorAll<HTMLElement>(".story-leaf"))
  const recordLeaves = Array.from(creative.querySelectorAll<HTMLElement>(".record-leaf"))
  const announce = root.querySelector<HTMLElement>("#orbit-announce")!
  let world: World = "stories"
  let lastPointer: World = "stories"
  let story = 0, record = 0, wheelAmount = 0, lastWheel = 0, touchX = 0, touchY = 0
  let touchWorld: World = "stories"

  function phone() { return matchMedia("(max-width: 819px)").matches }
  function status() {
    const mobile = phone()
    creative.classList.toggle("creative-reduced", reduced())
    worlds.stories.hidden = mobile && world !== "stories"
    worlds.music.hidden = mobile && world !== "music"
    worlds.stories.setAttribute("role", mobile ? "tabpanel" : "region")
    worlds.music.setAttribute("role", mobile ? "tabpanel" : "region")
    worlds.stories.inert = worlds.stories.hidden
    worlds.music.inert = worlds.music.hidden
    tabs.forEach((tab, index) => { const selected = index === (world === "stories" ? 0 : 1); tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1 })
    creative.querySelector<HTMLElement>("#story-count")!.textContent = `${story + 1} of ${storyCount}`
    creative.querySelector<HTMLElement>("#record-count")!.textContent = `${record + 1} of ${RELEASES.length}`
    beads.forEach((bead, index) => { bead.setAttribute("aria-current", String(index === story)); bead.setAttribute("aria-label", `${index === story ? "" : "Show "}${storyLeaves[index].querySelector("h4")!.textContent}, story ${index + 1} of ${storyCount}`) })
    discs.forEach((disc, index) => { disc.setAttribute("aria-current", String(index === record)); disc.setAttribute("aria-label", `${index === record ? "" : "Show "}${RELEASES[index].title}, record ${index + 1} of ${RELEASES.length}`) })
    storyLeaves.forEach((leaf, index) => { leaf.hidden = index !== story; leaf.inert = index !== story })
    recordLeaves.forEach((leaf, index) => { leaf.hidden = index !== record; leaf.inert = index !== record })
    creative.dataset.world = world
  }
  function select(next: World, focus = false) {
    world = next; lastPointer = next; status(); layout()
    announce.textContent = next === "stories" ? "Stories, sixteen pieces of short fiction" : "Alex's Hand, nine releases"
    if (focus) tabs[next === "stories" ? 0 : 1].focus({ preventScroll: true })
  }
  function go(next: number, target: World = world) {
    if (target === "stories") {
      story = creativeWrap(next, storyCount)
      announce.textContent = `${storyLeaves[story].querySelector("h4")!.textContent}, story ${story + 1} of ${storyCount}`
      status(); layout()
      if (beads.includes(document.activeElement as HTMLButtonElement)) beads[story].focus({ preventScroll: true })
    } else {
      record = creativeWrap(next, RELEASES.length)
      announce.textContent = `${RELEASES[record].title}, record ${record + 1} of ${RELEASES.length}`
      status(); layout()
      if (discs.includes(document.activeElement as HTMLButtonElement)) discs[record].focus({ preventScroll: true })
    }
  }
  function step(delta: number, target: World) { go((target === "stories" ? story : record) + delta, target) }
  function place(el: HTMLElement, box: { x: number; y: number; width: number; height: number }) {
    el.style.width = `${box.width}px`; el.style.height = `${box.height}px`
    el.style.transform = `translate3d(${box.x}px, ${box.y}px, 0)`
  }
  function layout() {
    status()
    if (storyStage.clientWidth && storyStage.clientHeight) {
      const g = storyGeometry(storyStage.clientWidth, storyStage.clientHeight, story)
      place(planet, g.planet)
      beads.forEach((bead, index) => place(bead, g.beads[index]))
    }
    if (recordStage.clientWidth && recordStage.clientHeight) {
      const boxes = recordGeometry(recordStage.clientWidth, recordStage.clientHeight, record)
      discs.forEach((disc, index) => { place(disc, boxes[index]); disc.style.zIndex = index === record ? "30" : String(8 - creativeWrap(index - record - 1, RELEASES.length)); disc.style.opacity = index === record ? "1" : String(.42 + .05 * (8 - creativeWrap(index - record - 1, RELEASES.length))) })
    }
  }
  tabs.forEach(tab => input.listen(tab, "click", () => select(tab.dataset.creativeWorld as World)))
  beads.forEach((bead, index) => input.listen(bead, "click", () => go(index, "stories")))
  discs.forEach((disc, index) => input.listen(disc, "click", () => go(index, "music")))
  creative.querySelectorAll<HTMLButtonElement>("[data-creative-step]").forEach(button => input.listen(button, "click", () => step(Number(button.dataset.creativeStep), button.dataset.creativeTarget as World)))
  Object.entries(worlds).forEach(([key, panel]) => input.listen(panel, "pointerenter", () => { lastPointer = key as World }))
  input.listen(window, "keydown", event => {
    const e = event as KeyboardEvent, target = e.target as HTMLElement
    if (!active() || e.altKey || e.ctrlKey || e.metaKey || target?.isContentEditable || /^(input|textarea|select)$/i.test(target?.tagName || "")) return
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    if (tabs.includes(target as HTMLButtonElement)) { select(e.key === "ArrowLeft" ? "stories" : "music", true); return }
    const focused = worlds.stories.contains(target) ? "stories" : worlds.music.contains(target) ? "music" : lastPointer
    step(e.key === "ArrowRight" ? 1 : -1, focused)
  })
  input.listen(window, "wheel", event => {
    const e = event as WheelEvent, target = e.target as HTMLElement
    if (!active() || target?.closest?.("input, textarea, select, [contenteditable]")) return
    const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 || (e.shiftKey && !e.deltaX && !!e.deltaY)
    if (!sideways) return
    const hit = target?.closest?.("#creative-stories, #creative-music") as HTMLElement | null
    if (!hit) return
    e.preventDefault()
    const nextWorld = hit.id === "creative-stories" ? "stories" : "music"
    lastPointer = nextWorld
    const now = performance.now()
    if (now - lastWheel > 350) wheelAmount = 0
    lastWheel = now
    wheelAmount += (e.deltaX || e.deltaY) * (e.deltaMode === 1 ? 16 : 1)
    if (Math.abs(wheelAmount) >= 40) { step(Math.sign(wheelAmount), nextWorld); wheelAmount = 0 }
  }, { passive: false })
  input.listen(creative, "touchstart", event => { const e = event as TouchEvent; if (e.touches.length === 1) { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; touchWorld = (e.target as HTMLElement).closest("#creative-music") ? "music" : "stories" } }, { passive: true })
  input.listen(creative, "touchend", event => { const e = event as TouchEvent; if (!active() || !e.changedTouches.length) return; const dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1, touchWorld) }, { passive: true })
  status(); layout()
  return { frame(_now: number) {}, layout, go, select, get world() { return world }, get story() { return story }, get record() { return record } }
}
