/**
 * Pointer, wheel, pinch and keyboard input for the Atlas, translated into
 * intent callbacks. Ported from the prototype's handlers. Escape is left to
 * React (it closes panels before leaving a galaxy).
 */
export type AtlasKey = "reset" | "zoomIn" | "zoomOut" | "left" | "right" | "up" | "down"

export interface AtlasInputHandlers {
  onDrag(dx: number, dy: number, dtMs: number): void
  onRelease(heldStillMs: number): void
  onZoom(cx: number, cy: number, k: number, rate: number): void
  onTap(x: number, y: number, touch: boolean): void
  onDoubleTap(x: number, y: number): void
  onHover(x: number | null, y: number | null): void
  onKey(key: AtlasKey): void
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
}

export function attachAtlasInput(canvas: HTMLCanvasElement, h: AtlasInputHandlers): () => void {
  const pointers = new Map<number, { x: number; y: number }>()
  let down: { x: number; y: number } | null = null
  let drag: { lx: number; ly: number; lt: number } | null = null
  let pinch: { d: number } | null = null
  let lastTap = { t: 0, x: 0, y: 0 }

  const onDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    down = { x: e.clientX, y: e.clientY }
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      /* capture is best-effort */
    }
    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()]
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }
      drag = null
    } else {
      drag = { lx: e.clientX, ly: e.clientY, lt: performance.now() }
    }
  }
  const onMove = (e: PointerEvent) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d > 0 && pinch.d > 0) h.onZoom((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.d / d, 16)
      pinch.d = d
      return
    }
    if (drag && pointers.size === 1) {
      const now = performance.now()
      const dx = e.clientX - drag.lx
      const dy = e.clientY - drag.ly
      if (dx !== 0 || dy !== 0) h.onDrag(dx, dy, now - drag.lt)
      drag.lx = e.clientX
      drag.ly = e.clientY
      drag.lt = now
      canvas.style.cursor = "grabbing"
      return
    }
    if (e.pointerType === "mouse") h.onHover(e.clientX, e.clientY)
  }
  const release = (e: PointerEvent) => {
    pointers.delete(e.pointerId)
    if (pointers.size < 2) pinch = null
    if (pointers.size === 0 && drag) {
      h.onRelease(performance.now() - drag.lt)
      drag = null
    }
  }
  const onUp = (e: PointerEvent) => {
    const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 99
    release(e)
    down = null
    if (moved > 6) return
    const touch = e.pointerType !== "mouse"
    if (touch) {
      const now = performance.now()
      if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
        h.onDoubleTap(e.clientX, e.clientY)
        lastTap.t = 0
        return
      }
      lastTap = { t: now, x: e.clientX, y: e.clientY }
    }
    h.onTap(e.clientX, e.clientY, touch)
  }
  const onDbl = (e: MouseEvent) => h.onDoubleTap(e.clientX, e.clientY)
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
    h.onZoom(e.clientX, e.clientY, Math.exp(Math.max(-120, Math.min(120, dy)) * 0.0016), 12)
  }
  const onLeave = () => h.onHover(null, null)
  const onKey = (e: KeyboardEvent) => {
    if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
    const map: Record<string, AtlasKey> = {
      r: "reset",
      R: "reset",
      "+": "zoomIn",
      "=": "zoomIn",
      "-": "zoomOut",
      _: "zoomOut",
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    }
    const k = map[e.key]
    if (!k) return
    if (k.startsWith("zoom") || k === "reset" || document.activeElement === canvas || document.activeElement === document.body) {
      if (e.key.startsWith("Arrow")) e.preventDefault()
      h.onKey(k)
    }
  }

  canvas.addEventListener("pointerdown", onDown)
  canvas.addEventListener("pointermove", onMove)
  canvas.addEventListener("pointerup", onUp)
  canvas.addEventListener("pointercancel", release)
  canvas.addEventListener("pointerleave", onLeave)
  canvas.addEventListener("dblclick", onDbl)
  canvas.addEventListener("wheel", onWheel, { passive: false })
  window.addEventListener("keydown", onKey)
  return () => {
    canvas.removeEventListener("pointerdown", onDown)
    canvas.removeEventListener("pointermove", onMove)
    canvas.removeEventListener("pointerup", onUp)
    canvas.removeEventListener("pointercancel", release)
    canvas.removeEventListener("pointerleave", onLeave)
    canvas.removeEventListener("dblclick", onDbl)
    canvas.removeEventListener("wheel", onWheel)
    window.removeEventListener("keydown", onKey)
  }
}
