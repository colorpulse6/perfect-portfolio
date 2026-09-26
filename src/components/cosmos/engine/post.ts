/**
 * Post-processing: a six-level bloom chain and the final composite (zoom
 * blur, chromatic aberration, exposure, soft-shoulder tonemap, vignette,
 * grain) to the default framebuffer.
 */
import type { Resources } from "./resources"
import type { Target } from "./gl"

export interface CompositeParams {
  focus: [number, number]
  zoom: number
  ca: number
  exposure: number
  bloomK: number
  grain: number
  vig: number
  flash: number
  streak: number
}

export const ATLAS_COMPOSITE: CompositeParams = {
  focus: [0.5, 0.5],
  zoom: 0,
  ca: 0,
  exposure: 1,
  bloomK: 0.85,
  grain: 0.02,
  vig: 0.45,
  flash: 0,
  streak: 0,
}

export function bloomPass(res: Resources, from: Target): void {
  const { gl, kit, prog } = res
  const blooms = res.sized!.blooms
  let P = kit.use(prog.down)
  let src = from
  blooms.forEach((b, i) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb)
    gl.viewport(0, 0, b.w, b.h)
    kit.U.v2(P, "uTexel", 0.5 / src.w, 0.5 / src.h)
    kit.U.f(P, "uPrefilter", i === 0 ? 1 : 0)
    kit.bindTex(P, "uSrc", 0, src.tex)
    kit.drawTri()
    src = b
  })
  P = kit.use(prog.up)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE)
  for (let i = blooms.length - 2; i >= 0; i--) {
    const dst = blooms[i]
    const s = blooms[i + 1]
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb)
    gl.viewport(0, 0, dst.w, dst.h)
    kit.U.v2(P, "uTexel", 1 / s.w, 1 / s.h)
    kit.bindTex(P, "uSrc", 0, s.tex)
    kit.drawTri()
  }
  gl.disable(gl.BLEND)
}

export function composite(res: Resources, from: Target, time: number, p: CompositeParams): void {
  const { gl, kit, prog } = res
  const s = res.sized!
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, s.bufW, s.bufH)
  const C = kit.use(prog.comp)
  kit.bindTex(C, "uHdr", 0, from.tex)
  kit.bindTex(C, "uBloom", 1, s.blooms[0].tex)
  kit.U.v2(C, "uFocus", p.focus[0], p.focus[1])
  kit.U.f(C, "uZoom", p.zoom)
  kit.U.f(C, "uCA", p.ca)
  kit.U.f(C, "uExposure", p.exposure)
  kit.U.f(C, "uBloomK", p.bloomK)
  kit.U.f(C, "uTime", time)
  kit.U.f(C, "uAspect", s.bufW / s.bufH)
  kit.U.f(C, "uGrain", p.grain)
  kit.U.f(C, "uVig", p.vig)
  kit.U.f(C, "uFlash", p.flash)
  kit.U.f(C, "uStreak", p.streak)
  kit.drawTri()
}
