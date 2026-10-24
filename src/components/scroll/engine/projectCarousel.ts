import type { AppItem } from "../data/types"
import type { createInput } from "./input"
import { orbitPoint, wrapIndex } from "./projectCarouselMath"

export function createProjectCarousel(root: HTMLElement, items: AppItem[], input: ReturnType<typeof createInput>, active: () => boolean, reduced: () => boolean) {
  const stage = root.querySelector<HTMLElement>("#projects .project-stage")!
  const globe = stage.querySelector<HTMLElement>(".project-globe")!
  const moons = Array.from(stage.querySelectorAll<HTMLButtonElement>(".project-moon"))
  const leaves = Array.from(stage.querySelectorAll<HTMLElement>(".project-leaf"))
  const count = root.querySelector<HTMLElement>("#project-count")!
  const announce = root.querySelector<HTMLElement>("#orbit-announce")!
  const back = stage.querySelector<SVGPathElement>(".project-track .back")!
  const front = stage.querySelector<SVGPathElement>(".project-track .front")!
  let current = 0
  let position = 0
  let from = 0
  let target = 0
  let started = 0
  let moving = false
  let wheelAmount = 0
  let lastWheel = 0
  let touchX = 0
  let touchY = 0
  let touchActive = false
  let canPlay = false
  const hideTimers: number[] = []
  const duration = 620

  function media(index: number, show: boolean) {
    const video = leaves[index].querySelector<HTMLVideoElement>("video")
    if (!video) return
    if (show && !reduced() && active()) {
      if (!video.src) { video.src = video.dataset.video!; video.load() }
      void video.play().catch(() => undefined)
    } else {
      video.pause()
      video.classList.remove("on")
      video.removeAttribute("src")
      video.load()
    }
  }
  function status(announceChange: boolean, previous = -1) {
    canPlay = active() && !reduced()
    count.textContent = `${current + 1} of ${items.length}`
    if (announceChange) announce.textContent = `${items[current].name}, ${current + 1} of ${items.length}`
    moons.forEach((moon, index) => {
      moon.setAttribute("aria-current", String(index === current))
      moon.setAttribute("aria-label", `${index === current ? "" : "Show "}${items[index].name}, ${index + 1} of ${items.length}`)
    })
    leaves.forEach((leaf, index) => {
      const show = index === current
      window.clearTimeout(hideTimers[index])
      if (show) {
        leaf.classList.remove("outgoing")
        leaf.hidden = false
      } else if (index === previous && !reduced()) {
        leaf.classList.add("outgoing")
        hideTimers[index] = window.setTimeout(() => { leaf.hidden = true; leaf.classList.remove("outgoing") }, 450)
      } else {
        leaf.hidden = true
        leaf.classList.remove("outgoing")
      }
      leaf.inert = !show
      if (show || videoHasSource(index)) media(index, show)
    })
  }
  function videoHasSource(index: number) { return !!leaves[index].querySelector<HTMLVideoElement>("video")?.src }
  function go(index: number) {
    const next = wrapIndex(index, items.length)
    if (next === current) return
    const focusMoon = moons.includes(document.activeElement as HTMLButtonElement)
    const previous = current
    let delta = next - position
    if (delta > items.length / 2) delta -= items.length
    if (delta < -items.length / 2) delta += items.length
    from = position
    target = position + delta
    current = next
    started = performance.now()
    moving = !reduced()
    if (!moving) position = target
    status(true, previous)
    layout()
    if (focusMoon) moons[current].focus({ preventScroll: true })
  }
  function layout() {
    const width = stage.clientWidth
    const height = stage.clientHeight
    if (!width || !height) return
    const g = orbitPoint(current, position, items.length, width, height)
    globe.style.left = `${g.cx - g.radius}px`
    globe.style.top = `${g.cy - g.radius}px`
    globe.style.width = globe.style.height = `${g.radius * 2}px`
    const a = g.radius * 1.35
    const b = g.radius * (width >= 820 ? 1 : 1.5)
    const tilt = 12 * Math.PI / 180
    const topX = g.cx + a * Math.sin(tilt)
    const topY = g.cy - a * Math.cos(tilt)
    const bottomX = g.cx - a * Math.sin(tilt)
    const bottomY = g.cy + a * Math.cos(tilt)
    const path = (sweep: number) => `M${topX},${topY} A${b},${a} 12 0 ${sweep} ${bottomX},${bottomY}`
    back.setAttribute("d", path(0))
    front.setAttribute("d", path(1))
    moons.forEach((moon, index) => {
      const p = orbitPoint(index, position, items.length, width, height)
      moon.style.width = moon.style.height = `${p.size}px`
      moon.style.transform = `translate3d(${p.x - p.size / 2}px, ${p.y - p.size / 2}px, 0)`
      moon.style.opacity = String(p.opacity)
      moon.style.zIndex = String(p.z)
      moon.style.visibility = p.hidden ? "hidden" : "visible"
      moon.querySelector<HTMLElement>(".project-dim")!.style.opacity = String(0.55 * (1 - Math.max(p.depth, p.front)))
    })
  }
  function frame(now: number) {
    if (moving) {
      const t = Math.min(1, (now - started) / duration)
      position = from + (target - from) * (1 - (1 - t) ** 3)
      if (t >= 1) { position = wrapIndex(target, items.length); moving = false }
      layout()
    }
  }
  moons.forEach((moon, index) => input.listen(moon, "click", () => go(index)))
  root.querySelectorAll<HTMLButtonElement>("#projects [data-project-step]").forEach(button => input.listen(button, "click", () => go(current + Number(button.dataset.projectStep))))
  input.listen(window, "keydown", event => {
    const e = event as KeyboardEvent
    if (!active() || e.altKey || e.ctrlKey || e.metaKey || /^(input|textarea|select)$/i.test((e.target as HTMLElement)?.tagName || "")) return
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(current + (e.key === "ArrowRight" ? 1 : -1)) }
  })
  input.listen(window, "wheel", event => {
    const e = event as WheelEvent
    if (!active()) return
    const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 || (e.shiftKey && !e.deltaX && !!e.deltaY)
    if (!sideways) return
    e.preventDefault()
    const delta = e.deltaX || e.deltaY
    const now = performance.now()
    if (now - lastWheel > 350) wheelAmount = 0
    lastWheel = now
    wheelAmount += delta * (e.deltaMode === 1 ? 16 : 1)
    if (Math.abs(wheelAmount) >= 40) { go(current + Math.sign(wheelAmount)); wheelAmount = 0 }
  }, { passive: false })
  input.listen(stage, "touchstart", event => {
    const e = event as TouchEvent
    if (e.touches.length !== 1) return
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; touchActive = true
  }, { passive: true })
  input.listen(stage, "touchend", event => {
    const e = event as TouchEvent
    if (!touchActive || !active() || !e.changedTouches.length) return
    touchActive = false
    const dx = e.changedTouches[0].clientX - touchX
    const dy = e.changedTouches[0].clientY - touchY
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) go(current + (dx < 0 ? 1 : -1))
  }, { passive: true })
  input.listen(stage, "touchcancel", () => { touchActive = false })
  leaves.forEach(leaf => {
    const video = leaf.querySelector<HTMLVideoElement>("video")
    if (video) input.listen(video, "playing", () => { if (leaves[current] === leaf && !reduced()) video.classList.add("on") })
  })
  status(false)
  layout()
  return { frame, layout, go, get current() { return current }, refresh() { if (canPlay !== (active() && !reduced())) status(false) }, dispose() { hideTimers.forEach(id => window.clearTimeout(id)); leaves.forEach((_, index) => media(index, false)) } }
}
