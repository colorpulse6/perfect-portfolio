/**
 * WebGL2 plumbing for the cosmos stage: context creation with capability
 * checks, non-blocking program compilation, render targets, fullscreen
 * geometry, and uniform setters. Browser-only; call from client code.
 */
export type GL = WebGL2RenderingContext

export interface GLCaps {
  aniso: EXT_texture_filter_anisotropic | null
  maxAniso: number
  /** KHR_parallel_shader_compile, when present: lets us poll instead of block. */
  parallel: { COMPLETION_STATUS_KHR: number } | null
}

export interface Program {
  p: WebGLProgram
  u: Record<string, WebGLUniformLocation | null>
}

export interface Target {
  tex: WebGLTexture
  fb: WebGLFramebuffer
  w: number
  h: number
}

export function createGL(canvas: HTMLCanvasElement): { gl: GL; caps: GLCaps } | { error: string } {
  let gl: GL | null = null
  try {
    gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    }) as GL | null
  } catch {
    gl = null
  }
  if (!gl) return { error: "WebGL2 is unavailable" }
  if (!gl.getExtension("EXT_color_buffer_float")) return { error: "Float render targets are unavailable" }
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic")
  const parallel = gl.getExtension("KHR_parallel_shader_compile") as { COMPLETION_STATUS_KHR: number } | null
  return {
    gl,
    caps: {
      aniso,
      maxAniso: aniso ? (gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number) : 1,
      parallel,
    },
  }
}

export interface PendingProgram {
  name: string
  p: WebGLProgram
  vs: WebGLShader
  fs: WebGLShader
  vsSrc: string
  fsSrc: string
}

export function startProgram(gl: GL, name: string, vsSrc: string, fsSrc: string): PendingProgram {
  const vs = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vs, vsSrc)
  gl.compileShader(vs)
  const fs = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(fs, fsSrc)
  gl.compileShader(fs)
  const p = gl.createProgram()!
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.linkProgram(p)
  return { name, p, vs, fs, vsSrc, fsSrc }
}

export function programReady(gl: GL, caps: GLCaps, pp: PendingProgram): boolean {
  if (!caps.parallel) return true
  return !!gl.getProgramParameter(pp.p, caps.parallel.COMPLETION_STATUS_KHR)
}

const numbered = (src: string) => src.split("\n").map((l, i) => `${i + 1}: ${l}`).join("\n")

/** Check compile and link status; throws with the driver log on failure. */
export function finishProgram(gl: GL, pp: PendingProgram): Program {
  if (!gl.getProgramParameter(pp.p, gl.LINK_STATUS)) {
    const vsLog = gl.getShaderInfoLog(pp.vs)
    const fsLog = gl.getShaderInfoLog(pp.fs)
    const log = gl.getProgramInfoLog(pp.p)
    if (fsLog && !gl.getShaderParameter(pp.fs, gl.COMPILE_STATUS)) {
      console.error(`[cosmos] ${pp.name} fragment shader:\n${fsLog}\n${numbered(pp.fsSrc)}`)
    } else if (vsLog && !gl.getShaderParameter(pp.vs, gl.COMPILE_STATUS)) {
      console.error(`[cosmos] ${pp.name} vertex shader:\n${vsLog}\n${numbered(pp.vsSrc)}`)
    }
    throw new Error(`${pp.name}: ${fsLog || vsLog || log || "link failed"}`)
  }
  gl.detachShader(pp.p, pp.vs)
  gl.detachShader(pp.p, pp.fs)
  gl.deleteShader(pp.vs)
  gl.deleteShader(pp.fs)
  const u: Record<string, WebGLUniformLocation | null> = {}
  const n = gl.getProgramParameter(pp.p, gl.ACTIVE_UNIFORMS) as number
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(pp.p, i)
    if (info) u[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(pp.p, info.name)
  }
  return { p: pp.p, u }
}

export type Vec3Like = ArrayLike<number>

/** Uniform setters, texture and target helpers, and fullscreen geometry bound to one context. */
export function makeKit(gl: GL) {
  const activate = (P: Program) => {
    gl.useProgram(P.p)
    return P
  }
  const U = {
    f: (P: Program, n: string, v: number) => {
      const l = P.u[n]
      if (l) gl.uniform1f(l, v)
    },
    i: (P: Program, n: string, v: number) => {
      const l = P.u[n]
      if (l) gl.uniform1i(l, v)
    },
    v2: (P: Program, n: string, a: number, b: number) => {
      const l = P.u[n]
      if (l) gl.uniform2f(l, a, b)
    },
    v3: (P: Program, n: string, v: Vec3Like) => {
      const l = P.u[n]
      if (l) gl.uniform3f(l, v[0], v[1], v[2])
    },
    v4: (P: Program, n: string, v: ArrayLike<number>) => {
      const l = P.u[n]
      if (l) gl.uniform4f(l, v[0], v[1], v[2], v[3])
    },
    m3: (P: Program, n: string, c: [Vec3Like, Vec3Like, Vec3Like]) => {
      const l = P.u[n]
      if (l) gl.uniformMatrix3fv(l, false, [c[0][0], c[0][1], c[0][2], c[1][0], c[1][1], c[1][2], c[2][0], c[2][1], c[2][2]])
    },
    m4: (P: Program, n: string, m: Float32Array) => {
      const l = P.u[n]
      if (l) gl.uniformMatrix4fv(l, false, m)
    },
    v3a: (P: Program, n: string, a: Float32Array) => {
      const l = P.u[n]
      if (l) gl.uniform3fv(l, a)
    },
    fa: (P: Program, n: string, a: Float32Array) => {
      const l = P.u[n]
      if (l) gl.uniform1fv(l, a)
    },
  }
  function tex2D(w: number, h: number, internal: number, format: number, type: number, filter: number): WebGLTexture {
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }
  function target(w: number, h: number): Target {
    const tex = tex2D(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR)
    const fb = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    if (!ok) throw new Error("Framebuffer incomplete")
    return { tex, fb, w, h }
  }
  const freeTarget = (t: Target | null | undefined) => {
    if (!t) return
    gl.deleteTexture(t.tex)
    gl.deleteFramebuffer(t.fb)
  }
  function bindTex(P: Program, name: string, unit: number, tex: WebGLTexture, kind: number = gl.TEXTURE_2D) {
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(kind, tex)
    U.i(P, name, unit)
  }

  const triVao = gl.createVertexArray()!
  gl.bindVertexArray(triVao)
  const triBuf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, triBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const quadVao = gl.createVertexArray()!
  gl.bindVertexArray(quadVao)
  const quadBuf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)
  const drawTri = () => {
    gl.bindVertexArray(triVao)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  const drawQuad = () => {
    gl.bindVertexArray(quadVao)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  const dispose = () => {
    gl.deleteVertexArray(triVao)
    gl.deleteVertexArray(quadVao)
    gl.deleteBuffer(triBuf)
    gl.deleteBuffer(quadBuf)
  }
  return { gl, activate, U, tex2D, target, freeTarget, bindTex, drawTri, drawQuad, dispose }
}

export type Kit = ReturnType<typeof makeKit>
