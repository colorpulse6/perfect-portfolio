/**
 * Journey passes, ported from the prototype (`updateLut`, `lensPass` and the
 * page texture upload in `drawPage`):
 * - the per-frame lookup table of wormhole deflection for the current throat
 *   distance, and
 * - the lens pass, which composes the home snapshot, both skies, the Atlas
 *   (pre-rendered into the destination target) and the throat glow.
 */
import { WH, lutMapFor } from "./wormholeMath"
import type { LutMap } from "./wormholeMath"
import type { AtlasSceneData } from "./atlasScene"
import type { JourneyFrames, JourneyParams } from "./journeyTimeline"
import type { Resources } from "./resources"

export interface LutState {
  map: LutMap
  /** |l| the table was last built for; skips rebuilding an unchanged table. */
  lastL: number
}

export const createLutState = (): LutState => ({ map: [0, 0, 0, 0], lastL: NaN })

export function updateLut(res: Resources, state: LutState, l: number): void {
  const L = Math.abs(l)
  if (L === state.lastL) return
  state.lastL = L
  state.map = lutMapFor(L)
  const { gl, kit, prog } = res
  gl.bindFramebuffer(gl.FRAMEBUFFER, res.lut.fb)
  gl.viewport(0, 0, res.lut.w, 1)
  gl.disable(gl.BLEND)
  const P = kit.activate(prog.lut)
  kit.U.f(P, "uL", L)
  kit.U.f(P, "uA", WH.a)
  kit.U.f(P, "uM", WH.M)
  kit.U.f(P, "uW", res.lut.w)
  kit.U.v4(P, "uMap", state.map)
  kit.drawTri()
}

export function lensPass(
  res: Resources,
  scene: AtlasSceneData,
  p: JourneyParams,
  f: JourneyFrames,
  lut: LutState,
  time: number
): void {
  const { gl, kit, prog } = res
  const s = res.sized!
  const U = kit.U
  gl.bindFramebuffer(gl.FRAMEBUFFER, s.hdr.fb)
  gl.viewport(0, 0, s.bufW, s.bufH)
  gl.disable(gl.BLEND)
  const L = kit.activate(prog.lens)
  U.v3(L, "uCamR", p.R)
  U.v3(L, "uCamU", p.U)
  U.v3(L, "uCamF", p.F)
  U.v2(L, "uTan", p.tanX, p.tanY)
  U.v3(L, "uX", f.JF.X)
  U.v3(L, "uY", f.JF.Y)
  U.v3(L, "uZ", f.JF.Z)
  U.f(L, "uSign", p.l >= 0 ? 1 : -1)
  U.f(L, "uLensOn", p.lensOn ? 1 : 0)
  U.f(L, "uFade", p.fade)
  U.f(L, "uLutW", res.lut.w)
  U.v4(L, "uMap", lut.map)
  U.v3(L, "uHR", f.HOME.R)
  U.v3(L, "uHU", f.HOME.U)
  U.v3(L, "uHF", f.HOME.F)
  U.v2(L, "uHTan", f.HOME.tanX, f.HOME.tanY)
  U.f(L, "uPull", p.pull)
  U.f(L, "uSwirl", p.swirl)
  U.f(L, "uDestTan", f.RT_TAN)
  U.m3(L, "uAtlasBasis", [f.ARR.R, f.ARR.U, f.ARR.F])
  U.f(L, "uRim", p.rim)
  U.v3(L, "uRimCol", [0.78, 0.88, 1.0])
  U.f(L, "uIgnite", p.ignite)
  U.v2(L, "uMouthNdc", p.mouthNdc[0], p.mouthNdc[1])
  U.f(L, "uTime", time)
  U.f(L, "uPx", (2 * p.tanY) / s.bufH)
  U.v3(L, "uBandN", scene.bandN)
  U.f(L, "uCtaGone", p.ctaGone)
  U.f(L, "uPageKeep", p.pageKeep)
  U.f(L, "uMagGamma", p.magGamma)
  U.f(L, "uIgR", p.igR)
  U.f(L, "uIgA", p.igA)
  U.f(L, "uTube", p.tube)
  kit.bindTex(L, "uLut", 0, res.lut.tex)
  kit.bindTex(L, "uPage", 1, res.pageTex)
  kit.bindTex(L, "uDest", 2, s.destRT.tex)
  kit.bindTex(L, "uNeb", 3, res.nebTex, gl.TEXTURE_CUBE_MAP)
  kit.bindTex(L, "uPageB", 4, res.pageTexB)
  kit.bindTex(L, "uLut2", 5, res.lut.tex2)
  kit.drawTri()
}

/**
 * Uploads a home snapshot as a page texture: mipmapped with anisotropic
 * filtering, because the lens samples it at steep, shrinking angles.
 */
export function uploadPage(res: Resources, tex: WebGLTexture, source: TexImageSource): void {
  const { gl, caps } = res
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  if (caps.aniso) gl.texParameterf(gl.TEXTURE_2D, caps.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, caps.maxAniso))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}
