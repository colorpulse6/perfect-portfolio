/**
 * Render the Atlas universe into a target: deep sky, the ray-traced black
 * hole, the cosmic web, domain galaxies, project stars, and the hover orbit
 * ring. `withSky` false renders only the objects (premultiplied, alpha marks
 * the black-hole lensing window) for the wormhole's destination view, where
 * the lens pass draws the stars analytically at full resolution.
 */
import { dot, sub, viewProj } from "./vec3"
import type { CamBasis } from "./vec3"
import type { Resources } from "./resources"
import type { Target } from "./gl"
import type { AtlasSceneData, SceneStar } from "./atlasScene"

export interface AtlasDraw {
  cam: CamBasis
  tanX: number
  tanY: number
  time: number
  withSky: boolean
  /** Entered galaxy index, or -1. */
  entered: number
  /** 0..1 reveal of the entered galaxy's project stars. */
  reveal: number
  /** Hovered star index in the star buffer, or -1. */
  hoverStar: number
  /** Per-galaxy brightness (8 values). */
  galDim: Float32Array
  webDim: number
}

type Rect = [number, number, number, number]

export function bhRect(scene: AtlasSceneData, cam: CamBasis, tanX: number, tanY: number): Rect | null {
  const q = sub(scene.bh.pos, cam.pos)
  const z = dot(q, cam.F)
  const dist = Math.hypot(q[0], q[1], q[2])
  const Rq = scene.bh.rs * 10.8
  if (dist < Rq * 1.05) return [-1, -1, 1, 1]
  if (z <= Rq) return null
  const x = dot(q, cam.R) / z / tanX
  const y = dot(q, cam.U) / z / tanY
  const ta = Math.tan(Math.asin(Rq / dist))
  const hx = (ta / tanX) * 1.3 + 0.01
  const hy = (ta / tanY) * 1.3 + 0.01
  return [Math.max(-1, x - hx), Math.max(-1, y - hy), Math.min(1, x + hx), Math.min(1, y + hy)]
}

/** Fraction of the view the black hole's lensing window covers. */
export function bhCoverage(scene: AtlasSceneData, cam: CamBasis, tanX: number, tanY: number): number {
  const r = bhRect(scene, cam, tanX, tanY)
  return r ? ((r[2] - r[0]) * (r[3] - r[1])) / 4 : 0
}

/** Upload the dotted orbit ring for a hovered star (null clears it). */
export function setHoverRing(res: Resources, scene: AtlasSceneData, star: SceneStar | null): void {
  if (!star) {
    res.ringCount = 0
    return
  }
  const g = scene.galaxies
  const c = g.cPos[star.domain]
  const e1 = g.e1v[star.domain]
  const e2 = g.e2v[star.domain]
  const n = 96
  const data = new Float32Array(n * 8)
  for (let i = 0; i < n; i++) {
    const u = i / n
    const a = u * Math.PI * 2
    const x = c[0] + (e1[0] * Math.cos(a) + e2[0] * Math.sin(a)) * star.rho
    const y = c[1] + (e1[1] * Math.cos(a) + e2[1] * Math.sin(a)) * star.rho
    const z = c[2] + (e1[2] * Math.cos(a) + e2[2] * Math.sin(a)) * star.rho
    data.set([x, y, z, u, 0.37, 0.18, 0.22, 0.024], i * 8)
  }
  const { gl } = res
  gl.bindBuffer(gl.ARRAY_BUFFER, res.ringBuf)
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
  res.ringCount = n
}

export function renderAtlas(res: Resources, scene: AtlasSceneData, tgt: Target, d: AtlasDraw): void {
  const { gl, kit, prog } = res
  const { use, U, bindTex } = kit
  const { cam, tanX, tanY, time, withSky } = d
  gl.bindFramebuffer(gl.FRAMEBUFFER, tgt.fb)
  gl.viewport(0, 0, tgt.w, tgt.h)
  gl.disable(gl.BLEND)
  const basis: [number[], number[], number[]] = [cam.R, cam.U, cam.F]
  const px = (2 * tanY) / tgt.h

  let rect = bhRect(scene, cam, tanX, tanY)
  const bigBh = withSky && !!rect && (rect[2] - rect[0]) * (rect[3] - rect[1]) > 4 * 0.55
  if (bigBh) rect = [-1, -1, 1, 1]
  if (withSky && !bigBh) {
    const P = use(prog.sky)
    U.m3(P, "uBasis", basis)
    U.v2(P, "uTan2", tanX, tanY)
    U.f(P, "uPx", px)
    U.v3(P, "uBandN", scene.bandN)
    bindTex(P, "uNeb", 3, res.nebTex, gl.TEXTURE_CUBE_MAP)
    kit.drawTri()
  } else if (!withSky) {
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }
  if (withSky) gl.disable(gl.BLEND)
  else {
    gl.enable(gl.BLEND)
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  }
  if (rect) {
    const P = use(prog.bh)
    U.v4(P, "uRect", rect)
    U.m3(P, "uBasis", basis)
    U.v2(P, "uTan2", tanX, tanY)
    U.v3(P, "uCamPos", cam.pos)
    U.v3(P, "uBhPos", scene.bh.pos)
    U.f(P, "uRs", scene.bh.rs)
    U.m3(P, "uDisk", scene.bh.frame)
    U.f(P, "uTime", time)
    U.f(P, "uPx", px)
    U.v3(P, "uBandN", scene.bandN)
    U.f(P, "uOpaque", withSky ? 1 : 0)
    bindTex(P, "uNeb", 3, res.nebTex, gl.TEXTURE_CUBE_MAP)
    kit.drawQuad()
  }

  gl.enable(gl.BLEND)
  gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE)
  const vp = viewProj(cam, tanX, tanY)
  const pxScale = tgt.h / 2 / tanY
  const shadowR = scene.bh.rs * 2.6
  const g = scene.galaxies

  let P = use(prog.web)
  U.m4(P, "uVP", vp)
  U.f(P, "uPxScale", pxScale)
  U.f(P, "uTime", time)
  U.f(P, "uDim", d.webDim)
  U.v3(P, "uCamPos", cam.pos)
  U.v3(P, "uBhPos", scene.bh.pos)
  U.f(P, "uShadowR", shadowR)
  gl.bindVertexArray(res.webVao)
  gl.drawArrays(gl.POINTS, 0, res.webCount)
  if (res.ringCount > 0) {
    U.f(P, "uDim", 1.6)
    gl.bindVertexArray(res.ringVao)
    gl.drawArrays(gl.POINTS, 0, res.ringCount)
  }

  P = use(prog.gal)
  U.m4(P, "uVP", vp)
  U.f(P, "uPxScale", pxScale)
  U.f(P, "uTime", time)
  U.v3(P, "uCamPos", cam.pos)
  U.v3(P, "uBhPos", scene.bh.pos)
  U.f(P, "uShadowR", shadowR)
  U.v3a(P, "uGC", g.c)
  U.v3a(P, "uGE1", g.e1)
  U.v3a(P, "uGE2", g.e2)
  U.v3a(P, "uGN", g.n)
  U.fa(P, "uGDim", d.galDim)
  gl.bindVertexArray(res.galVao)
  gl.drawArrays(gl.POINTS, 0, res.galCount)

  if (res.starCount > 0) {
    P = use(prog.star)
    U.m4(P, "uVP", vp)
    U.f(P, "uPxScale", pxScale)
    U.f(P, "uTime", time)
    U.v3(P, "uCamPos", cam.pos)
    U.v3(P, "uBhPos", scene.bh.pos)
    U.f(P, "uShadowR", shadowR)
    U.v3a(P, "uGC", g.c)
    U.v3a(P, "uGE1", g.e1)
    U.v3a(P, "uGE2", g.e2)
    U.v3a(P, "uGN", g.n)
    U.f(P, "uEntered", d.entered)
    U.f(P, "uReveal", d.reveal)
    U.f(P, "uHover", d.hoverStar)
    gl.bindVertexArray(res.starVao)
    gl.drawArrays(gl.POINTS, 0, res.starCount)
  }
  gl.bindVertexArray(null)
  gl.disable(gl.BLEND)
}
