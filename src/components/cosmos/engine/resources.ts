/**
 * GPU resources for the cosmos stage: the program set (compiled without
 * blocking where the driver allows), scene buffers, the nebula cube map, the
 * lensing lookup targets, and the size-dependent render targets.
 */
import { startProgram, programReady, finishProgram, makeKit } from "./gl"
import type { GL, GLCaps, Kit, Program, Target, PendingProgram } from "./gl"
import type { TierSettings } from "./quality"
import { shaderDefines } from "./quality"
import type { AtlasSceneData } from "./atlasScene"
import {
  HEAD,
  COMMON,
  VS_TRI,
  VS_QUAD,
  VS_GAL,
  VS_WEB,
  VS_STAR,
  FS_LUT,
  FS_NEB,
  FS_SKY,
  FS_BH,
  FS_LENS,
  FS_PT,
  FS_STAR,
  FS_DOWN,
  FS_UP,
  FS_COMP,
} from "./shaders"

export type ProgramName = "lut" | "neb" | "sky" | "bh" | "lens" | "gal" | "web" | "star" | "down" | "up" | "comp"
export type Programs = Record<ProgramName, Program>

const SOURCES: Record<ProgramName, [string, string, boolean]> = {
  lut: [VS_TRI, FS_LUT, false],
  neb: [VS_TRI, FS_NEB, true],
  sky: [VS_TRI, FS_SKY, true],
  bh: [VS_QUAD, FS_BH, true],
  lens: [VS_TRI, FS_LENS, true],
  gal: [VS_GAL, FS_PT, false],
  web: [VS_WEB, FS_PT, false],
  star: [VS_STAR, FS_STAR, false],
  down: [VS_TRI, FS_DOWN, false],
  up: [VS_TRI, FS_UP, false],
  comp: [VS_TRI, FS_COMP, false],
}

/**
 * Compiles every program. With KHR_parallel_shader_compile all programs start
 * at once and `step()` polls; without it, `step()` compiles one program per
 * call so idle-time warm-up never blocks for long. `step()` returns true once
 * everything is linked; it throws on a compile or link failure.
 */
export function createProgramCompiler(gl: GL, caps: GLCaps, settings: TierSettings) {
  const defines = shaderDefines(settings)
  const names = Object.keys(SOURCES) as ProgramName[]
  const build = (n: ProgramName): PendingProgram => {
    const [vs, fs, common] = SOURCES[n]
    return startProgram(gl, n, HEAD + vs, HEAD + defines + (common ? COMMON : "") + fs)
  }
  const pending: PendingProgram[] = caps.parallel ? names.map(build) : []
  let next = 0
  const done: Partial<Programs> = {}
  return {
    step(): boolean {
      if (caps.parallel) {
        for (const pp of pending) {
          const n = pp.name as ProgramName
          if (!done[n] && programReady(gl, caps, pp)) done[n] = finishProgram(gl, pp)
        }
      } else if (next < names.length) {
        const n = names[next++]
        done[n] = finishProgram(gl, build(n))
      }
      return names.every((n) => !!done[n])
    },
    /** Finish synchronously (blocks until the driver is done). */
    finishAll(): Programs {
      while (!this.step()) {
        if (caps.parallel) {
          for (const pp of pending) {
            const n = pp.name as ProgramName
            if (!done[n]) done[n] = finishProgram(gl, pp)
          }
        }
      }
      return done as Programs
    },
    programs(): Programs {
      return done as Programs
    },
  }
}

export interface SizedTargets {
  bufW: number
  bufH: number
  hdr: Target
  destRT: Target
  blooms: Target[]
}

export interface Resources {
  gl: GL
  kit: Kit
  caps: GLCaps
  settings: TierSettings
  prog: Programs
  galVao: WebGLVertexArrayObject
  galCount: number
  webVao: WebGLVertexArrayObject
  webCount: number
  starVao: WebGLVertexArrayObject
  starCount: number
  ringVao: WebGLVertexArrayObject
  ringBuf: WebGLBuffer
  ringCount: number
  nebTex: WebGLTexture
  lut: { tex: WebGLTexture; tex2: WebGLTexture; fb: WebGLFramebuffer; w: number }
  pageTex: WebGLTexture
  pageTexB: WebGLTexture
  sized: SizedTargets | null
  hdrA: Target | null
  buffers: WebGLBuffer[]
}

function vao(gl: GL, data: Float32Array, layout: [number, number][], stride: number, buffers: WebGLBuffer[]) {
  const v = gl.createVertexArray()!
  gl.bindVertexArray(v)
  const b = gl.createBuffer()!
  buffers.push(b)
  gl.bindBuffer(gl.ARRAY_BUFFER, b)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  let offset = 0
  layout.forEach(([loc, size]) => {
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset)
    offset += size * 4
  })
  gl.bindVertexArray(null)
  return v
}

/** Project stars plus the fiction knot: 9 floats each (gi, rho, th0, h, r, g, b, size, index). */
export function starBufferData(scene: AtlasSceneData): Float32Array {
  const all = scene.fictionKnot ? [...scene.stars, scene.fictionKnot] : scene.stars
  const out = new Float32Array(all.length * 9)
  all.forEach((s, i) => out.set([s.domain, s.rho, s.th0, s.h, s.color[0], s.color[1], s.color[2], s.size, i], i * 9))
  return out
}

function buildNebula(kit: Kit, prog: Programs, bandN: ArrayLike<number>): WebGLTexture {
  const { gl } = kit
  const size = 256
  const t = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, t)
  for (let f = 0; f < 6; f++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, 0, gl.RGBA16F, size, size, 0, gl.RGBA, gl.HALF_FLOAT, null)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fb = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.viewport(0, 0, size, size)
  const P = kit.activate(prog.neb)
  kit.U.f(P, "uSize", size)
  kit.U.v3(P, "uBandN", bandN)
  for (let f = 0; f < 6; f++) {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, t, 0)
    kit.U.i(P, "uFace", f)
    kit.drawTri()
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.deleteFramebuffer(fb)
  return t
}

export function createResources(gl: GL, caps: GLCaps, settings: TierSettings, prog: Programs, scene: AtlasSceneData): Resources {
  const kit = makeKit(gl)
  const buffers: WebGLBuffer[] = []
  const galVao = vao(gl, scene.galaxyPoints, [[0, 4], [1, 4]], 32, buffers)
  const webVao = vao(gl, scene.webPoints, [[0, 4], [1, 4]], 32, buffers)
  const starData = starBufferData(scene)
  const starVao = vao(gl, starData, [[0, 4], [1, 4], [2, 1]], 36, buffers)

  const ringVao = gl.createVertexArray()!
  gl.bindVertexArray(ringVao)
  const ringBuf = gl.createBuffer()!
  buffers.push(ringBuf)
  gl.bindBuffer(gl.ARRAY_BUFFER, ringBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(96 * 8), gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16)
  gl.bindVertexArray(null)

  const nebTex = buildNebula(kit, prog, scene.bandN)

  const lutW = settings.lutW
  const lutTex = kit.tex2D(lutW, 1, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR)
  const lutTex2 = kit.tex2D(lutW, 1, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR)
  const lutFb = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, lutFb)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lutTex, 0)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, lutTex2, 0)
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1])
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return {
    gl,
    kit,
    caps,
    settings,
    prog,
    galVao,
    galCount: scene.galaxyPoints.length / 8,
    webVao,
    webCount: scene.webPoints.length / 8,
    starVao,
    starCount: starData.length / 9,
    ringVao,
    ringBuf,
    ringCount: 0,
    nebTex,
    lut: { tex: lutTex, tex2: lutTex2, fb: lutFb, w: lutW },
    pageTex: gl.createTexture()!,
    pageTexB: gl.createTexture()!,
    sized: null,
    hdrA: null,
    buffers,
  }
}

/** Rebuild the scene buffers after the topology changes. */
export function uploadScene(res: Resources, scene: AtlasSceneData): void {
  const { gl } = res
  const upload = (v: WebGLVertexArrayObject, data: Float32Array) => {
    gl.bindVertexArray(v)
    const b = gl.getVertexAttrib(0, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING) as WebGLBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, b)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    gl.bindVertexArray(null)
  }
  upload(res.galVao, scene.galaxyPoints)
  res.galCount = scene.galaxyPoints.length / 8
  upload(res.webVao, scene.webPoints)
  res.webCount = scene.webPoints.length / 8
  const stars = starBufferData(scene)
  upload(res.starVao, stars)
  res.starCount = stars.length / 9
}

/** (Re)create the size-dependent targets when the drawing buffer changes. */
export function ensureTargets(res: Resources, bufW: number, bufH: number): SizedTargets {
  const s = res.sized
  if (s && s.bufW === bufW && s.bufH === bufH) return s
  const { kit, settings } = res
  if (s) {
    kit.freeTarget(s.hdr)
    kit.freeTarget(s.destRT)
    s.blooms.forEach(kit.freeTarget)
  }
  kit.freeTarget(res.hdrA)
  res.hdrA = null
  const rts = Math.min(settings.rtMax, Math.round(Math.max(bufW, bufH) * settings.rtScale))
  const blooms: Target[] = []
  let bw = bufW
  let bh = bufH
  for (let i = 0; i < 6; i++) {
    bw = Math.max(1, bw >> 1)
    bh = Math.max(1, bh >> 1)
    blooms.push(kit.target(bw, bh))
  }
  res.sized = { bufW, bufH, hdr: kit.target(bufW, bufH), destRT: kit.target(rts, rts), blooms }
  return res.sized
}

/** Reduced-resolution HDR target for adaptive resolution in Atlas mode. */
export function atlasTarget(res: Resources, scale: number): Target {
  const s = res.sized!
  if (scale >= 0.999) {
    res.kit.freeTarget(res.hdrA)
    res.hdrA = null
    return s.hdr
  }
  const w = Math.max(1, Math.round(s.bufW * scale))
  const h = Math.max(1, Math.round(s.bufH * scale))
  if (!res.hdrA || res.hdrA.w !== w || res.hdrA.h !== h) {
    res.kit.freeTarget(res.hdrA)
    res.hdrA = res.kit.target(w, h)
  }
  return res.hdrA
}

export function disposeResources(res: Resources): void {
  const { gl, kit } = res
  if (res.sized) {
    kit.freeTarget(res.sized.hdr)
    kit.freeTarget(res.sized.destRT)
    res.sized.blooms.forEach(kit.freeTarget)
  }
  kit.freeTarget(res.hdrA)
  ;[res.galVao, res.webVao, res.starVao, res.ringVao].forEach((v) => gl.deleteVertexArray(v))
  res.buffers.forEach((b) => gl.deleteBuffer(b))
  gl.deleteTexture(res.nebTex)
  gl.deleteTexture(res.lut.tex)
  gl.deleteTexture(res.lut.tex2)
  gl.deleteFramebuffer(res.lut.fb)
  gl.deleteTexture(res.pageTex)
  gl.deleteTexture(res.pageTexB)
  Object.values(res.prog).forEach((P) => gl.deleteProgram(P.p))
  kit.dispose()
}
