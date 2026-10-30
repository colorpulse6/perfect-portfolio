import { COLORPULSE_ALBUMS, RELEASES } from "../data/content"
import type { createInput } from "./input"
import { creativeWrap } from "./creativeCarouselMath"

type World = "stories" | "music"
type Project = "alex" | "colorpulse" | "priaprizm"
export function createCreativeCarousel(root: HTMLElement, storyCount: number, input: ReturnType<typeof createInput>, active: () => boolean, reduced: () => boolean) {
  const creative = root.querySelector<HTMLElement>("#creative")!
  const tabs = Array.from(creative.querySelectorAll<HTMLButtonElement>("[data-creative-world]"))
  const musicTabs = Array.from(creative.querySelectorAll<HTMLButtonElement>("[data-music-project]"))
  const worlds = { stories: creative.querySelector<HTMLElement>("#creative-stories")!, music: creative.querySelector<HTMLElement>("#creative-music")! }
  const projects = { alex: creative.querySelector<HTMLElement>("#music-panel-alex")!, colorpulse: creative.querySelector<HTMLElement>("#music-panel-colorpulse")!, priaprizm: creative.querySelector<HTMLElement>("#music-panel-priaprizm")! }
  const choices = Array.from(creative.querySelectorAll<HTMLButtonElement>(".story-choice"))
  const storyLeaves = Array.from(creative.querySelectorAll<HTMLElement>(".story-leaf"))
  const recordLeaves = Array.from(creative.querySelectorAll<HTMLElement>(".record-leaf"))
  const tapeLeaves = Array.from(creative.querySelectorAll<HTMLElement>(".tape-leaf"))
  const announce = root.querySelector<HTMLElement>("#orbit-announce")!
  const progress = creative.querySelector<HTMLElement>(".story-progress")!
  let world: World = "stories", project: Project = "alex"
  let story = 0, record = 0, tape = 0, wheelAmount = 0, lastWheel = 0, touchX = 0, touchY = 0
  let touchWorld: World = "stories"
  function phone() { return matchMedia("(max-width: 819px)").matches }
  function updateProgress() {
    const scroll = storyLeaves[story].querySelector<HTMLElement>(".story-text")!
    const value = Math.round(100 * scroll.scrollTop / Math.max(1, scroll.scrollHeight - scroll.clientHeight))
    progress.setAttribute("aria-valuenow", String(Math.min(100, value)))
    progress.querySelector<HTMLElement>("span")!.style.width = `${Math.min(100, value)}%`
  }
  function status() {
    const mobile = phone()
    creative.classList.toggle("creative-reduced", reduced())
    for (const [key, panel] of Object.entries(worlds)) {
      panel.hidden = mobile && key !== world
      panel.inert = panel.hidden
      panel.setAttribute("role", mobile ? "tabpanel" : "region")
    }
    tabs.forEach((tab, index) => { const selected = index === (world === "stories" ? 0 : 1); tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1 })
    for (const [key, panel] of Object.entries(projects)) { panel.hidden = key !== project; panel.inert = panel.hidden }
    musicTabs.forEach(tab => { const selected = tab.dataset.musicProject === project; tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1 })
    choices.forEach((choice, index) => choice.setAttribute("aria-current", String(index === story)))
    storyLeaves.forEach((leaf, index) => { leaf.hidden = index !== story; leaf.inert = index !== story })
    recordLeaves.forEach((leaf, index) => { leaf.hidden = index !== record; leaf.inert = index !== record })
    tapeLeaves.forEach((leaf, index) => { leaf.hidden = index !== tape; leaf.inert = index !== tape })
    creative.querySelector<HTMLElement>("#story-count")!.textContent = `${story + 1} of ${storyCount}`
    creative.querySelector<HTMLElement>("#record-count")!.textContent = `${record + 1} of ${RELEASES.length}`
    creative.querySelector<HTMLElement>("#tape-count")!.textContent = `${tape + 1} of ${COLORPULSE_ALBUMS.length}`
    creative.dataset.world = world
    updateProgress()
  }
  function select(next: World, focus = false) {
    world = next; status()
    announce.textContent = next === "stories" ? `Stories, ${storyCount} pieces of short fiction` : "Music, three projects"
    if (focus) tabs[next === "stories" ? 0 : 1].focus({ preventScroll: true })
  }
  function selectProject(next: Project, focus = false) {
    project = next; status()
    announce.textContent = next === "alex" ? "Alex's Hand, nine albums" : next === "colorpulse" ? "Colorpulse, three albums" : "Priaprizm"
    if (focus) musicTabs.find(tab => tab.dataset.musicProject === next)?.focus({ preventScroll: true })
  }
  function go(next: number, target: World = world) {
    if (target === "stories") {
      story = creativeWrap(next, storyCount)
      storyLeaves[story].querySelector<HTMLElement>(".story-text")!.scrollTop = 0
      announce.textContent = `${storyLeaves[story].querySelector("h4")!.textContent}, story ${story + 1} of ${storyCount}`
      status()
      if (choices.includes(document.activeElement as HTMLButtonElement)) choices[story].focus({ preventScroll: true })
    } else if (project === "alex") {
      record = creativeWrap(next, RELEASES.length)
      announce.textContent = `${RELEASES[record].title}, album ${record + 1} of ${RELEASES.length}`
      status()
    } else if (project === "colorpulse") {
      tape = creativeWrap(next, COLORPULSE_ALBUMS.length)
      announce.textContent = `${COLORPULSE_ALBUMS[tape].title}, album ${tape + 1} of ${COLORPULSE_ALBUMS.length}`
      status()
    }
  }
  function step(delta: number, target: World) { go((target === "stories" ? story : project === "alex" ? record : tape) + delta, target) }
  tabs.forEach(tab => input.listen(tab, "click", () => select(tab.dataset.creativeWorld as World)))
  musicTabs.forEach(tab => input.listen(tab, "click", () => selectProject(tab.dataset.musicProject as Project)))
  choices.forEach((choice, index) => input.listen(choice, "click", () => go(index, "stories")))
  creative.querySelectorAll<HTMLButtonElement>("[data-creative-step]").forEach(button => input.listen(button, "click", () => step(Number(button.dataset.creativeStep), button.dataset.creativeTarget as World)))
  storyLeaves.forEach(leaf => input.listen(leaf.querySelector<HTMLElement>(".story-text")!, "scroll", updateProgress, { passive: true }))
  input.listen(window, "keydown", event => {
    const e = event as KeyboardEvent, target = e.target as HTMLElement
    if (!active() || e.altKey || e.ctrlKey || e.metaKey || target?.isContentEditable || /^(input|textarea|select)$/i.test(target?.tagName || "")) return
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    if (musicTabs.includes(target as HTMLButtonElement)) { e.preventDefault(); selectProject(creativeWrap(musicTabs.indexOf(target as HTMLButtonElement) + (e.key === "ArrowRight" ? 1 : -1), 3) === 0 ? "alex" : creativeWrap(musicTabs.indexOf(target as HTMLButtonElement) + (e.key === "ArrowRight" ? 1 : -1), 3) === 1 ? "colorpulse" : "priaprizm", true); return }
    if (tabs.includes(target as HTMLButtonElement)) { e.preventDefault(); select(e.key === "ArrowLeft" ? "stories" : "music", true); return }
    const focused = worlds.stories.contains(target) ? "stories" : worlds.music.contains(target) ? "music" : null
    if (!focused) return
    e.preventDefault(); step(e.key === "ArrowRight" ? 1 : -1, focused)
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
    const now = performance.now()
    if (now - lastWheel > 350) wheelAmount = 0
    lastWheel = now
    wheelAmount += (e.deltaX || e.deltaY) * (e.deltaMode === 1 ? 16 : 1)
    if (Math.abs(wheelAmount) >= 40) { step(Math.sign(wheelAmount), nextWorld); wheelAmount = 0 }
  }, { passive: false })
  input.listen(creative, "touchstart", event => { const e = event as TouchEvent; if (e.touches.length === 1) { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; touchWorld = (e.target as HTMLElement).closest("#creative-music") ? "music" : "stories" } }, { passive: true })
  input.listen(creative, "touchend", event => { const e = event as TouchEvent; if (!active() || !e.changedTouches.length) return; const dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1, touchWorld) }, { passive: true })
  status()
  return { frame(_now: number) {}, layout: status, go, select, selectProject, get world() { return world }, get story() { return story }, get record() { return record }, get tape() { return tape }, get project() { return project } }
}
