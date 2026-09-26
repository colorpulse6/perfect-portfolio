/**
 * One-frame capture of the home particle canvas for the journey snapshot.
 *
 * The R3F canvas does not preserve its drawing buffer (and cannot: it is
 * created once and reused on every non-Atlas route), so the capture runs in
 * an `addAfterEffect` callback. That runs after the frame's render, bloom
 * composer included, and before the browser presents and clears the buffer.
 */
import { addAfterEffect } from "@react-three/fiber"

let getCanvas: (() => HTMLCanvasElement | null) | null = null

/** Returns an unregister function that only clears this registration. */
export function registerParticleCanvas(get: () => HTMLCanvasElement | null): () => void {
  getCanvas = get
  return () => {
    if (getCanvas === get) getCanvas = null
  }
}

/**
 * Draws the next rendered particle frame into `ctx`, stretched to `w` x `h`.
 * Resolves false when nothing is registered or no frame renders within 120ms.
 */
export function captureParticles(ctx: CanvasRenderingContext2D, w: number, h: number): Promise<boolean> {
  const get = getCanvas
  if (!get) return Promise.resolve(false)
  return new Promise((resolve) => {
    let done = false
    let unsubscribe: (() => void) | null = null
    let timer = 0
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      unsubscribe?.()
      window.clearTimeout(timer)
      resolve(ok)
    }
    unsubscribe = addAfterEffect(() => {
      const canvas = get()
      if (!canvas || canvas.width === 0) return finish(false)
      try {
        ctx.drawImage(canvas, 0, 0, w, h)
        finish(true)
      } catch {
        finish(false)
      }
    })
    timer = window.setTimeout(() => finish(false), 120)
  })
}
