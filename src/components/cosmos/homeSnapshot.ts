/**
 * Rasterizes the live home page for the wormhole hand-off. The lens bends
 * this image from the first journey frame, so it has to match what the
 * visitor sees at the click: any mismatch shows as a pop.
 *
 * It reads live geometry and computed styles and draws, in stacking order,
 * the elements marked `data-cosmos-snapshot="<order>"`: boxes (background,
 * border, radius, outer shadow), text one character at a time from Range
 * rects (so letter spacing and wrapping match), images, video frames,
 * canvases and inline SVG. `backdrop-filter` blur is not reproduced.
 */
import { captureParticles } from "./particleCapture"

export interface HomeSnapshot {
  page: HTMLCanvasElement
  /** The same page without the call to action (the lens fades it out). */
  pageNoCta: HTMLCanvasElement
}

/** Matches the page background under the particle canvas. */
const PAGE_BG = "#111"

export async function snapshotHome(opts: { dpr: number; cta: Element | null }): Promise<HomeSnapshot> {
  const dpr = opts.dpr
  const w = window.innerWidth
  const h = window.innerHeight
  const bw = Math.max(1, Math.round(w * dpr))
  const bh = Math.max(1, Math.round(h * dpr))

  const pageNoCta = makeCanvas(bw, bh)
  const b = pageNoCta.getContext("2d")!
  b.fillStyle = PAGE_BG
  b.fillRect(0, 0, bw, bh)
  await captureParticles(b, bw, bh)

  const html = document.documentElement
  html.setAttribute("data-cosmos-snap", "")
  try {
    const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-cosmos-snapshot]"))
      .map((el, i) => ({ el, i, z: Number(el.dataset.cosmosSnapshot) || 0 }))
      .sort((p, q) => p.z - q.z || p.i - q.i)
    b.save()
    b.scale(dpr, dpr)
    for (const r of roots) drawTree(b, r.el, opacityAbove(r.el), opts.cta, dpr)
    b.restore()

    const page = makeCanvas(bw, bh)
    const a = page.getContext("2d")!
    a.drawImage(pageNoCta, 0, 0)
    if (opts.cta) {
      a.save()
      a.scale(dpr, dpr)
      drawTree(a, opts.cta, opacityAbove(opts.cta), null, dpr)
      a.restore()
    }
    return { page, pageNoCta }
  } finally {
    html.removeAttribute("data-cosmos-snap")
  }
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  return c
}

function opacityAbove(el: Element): number {
  let o = 1
  for (let p = el.parentElement; p; p = p.parentElement) o *= parseFloat(getComputedStyle(p).opacity) || 0
  return o
}

// ── Tree walk ────────────────────────────────────────────────────────────

function drawTree(ctx: CanvasRenderingContext2D, el: Element, opacityIn: number, skip: Element | null, dpr: number) {
  if (el === skip) return
  const cs = getComputedStyle(el)
  if (cs.display === "none" || cs.visibility === "hidden") return
  const opacity = opacityIn * (parseFloat(cs.opacity) || 0)
  if (opacity < 0.004) return

  if (el instanceof SVGSVGElement) {
    drawSvg(ctx, el, opacity)
    return
  }
  const r = el.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return
  drawBox(ctx, cs, r, opacity, dpr)
  if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el instanceof HTMLCanvasElement) {
    drawMedia(ctx, el, cs, r, opacity)
    return
  }

  // Children clipped by overflow (card excerpts, rounded media frames).
  const clips = cs.overflowX !== "visible" || cs.overflowY !== "visible"
  if (clips) {
    ctx.save()
    ctx.beginPath()
    roundRectPath(ctx, r.left, r.top, r.width, r.height, radiusOf(cs, r))
    ctx.clip()
  }
  let range: Range | null = null
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      range = range || document.createRange()
      drawText(ctx, node as Text, el as HTMLElement, cs, opacity, range, dpr)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      drawTree(ctx, node as Element, opacity, skip, dpr)
    }
  }
  if (clips) ctx.restore()
}

// ── Boxes ────────────────────────────────────────────────────────────────

function radiusOf(cs: CSSStyleDeclaration, r: DOMRect): number {
  const v = parseFloat(cs.borderTopLeftRadius) || 0
  const pct = cs.borderTopLeftRadius.trim().endsWith("%")
  return Math.min(pct ? (v / 100) * Math.min(r.width, r.height) : v, r.width / 2, r.height / 2)
}

function roundRectPath(ctx: CanvasRenderingContext2D | Path2D, x: number, y: number, w: number, h: number, rad: number) {
  const r = Math.max(0, Math.min(rad, w / 2, h / 2))
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const alphaOf = (color: string) => {
  if (!color || color === "transparent") return 0
  const m = /rgba?\(([^)]+)\)/.exec(color)
  if (!m) return 1
  const parts = m[1].split(/[\s,/]+/).filter(Boolean)
  return parts.length > 3 ? parseFloat(parts[3]) : 1
}

interface Shadow {
  color: string
  x: number
  y: number
  blur: number
  spread: number
}

/** First outer shadow of a computed `box-shadow` or `text-shadow` value. */
function parseShadow(value: string): Shadow | null {
  if (!value || value === "none") return null
  const first = value.split(/,(?![^(]*\))/)[0].trim()
  if (/\binset\b/.test(first)) return null
  const color = /(rgba?\([^)]*\)|#[0-9a-f]{3,8}|[a-z]+)(?=\s|$)/i.exec(first)?.[1] || "rgba(0,0,0,0.5)"
  const nums = (first.replace(/rgba?\([^)]*\)/, "").match(/-?[\d.]+px|-?[\d.]+(?=\s|$)/g) || []).map((n) => parseFloat(n))
  if (nums.length < 2 || alphaOf(color) === 0) return null
  return { color, x: nums[0], y: nums[1], blur: nums[2] || 0, spread: nums[3] || 0 }
}

function drawBox(ctx: CanvasRenderingContext2D, cs: CSSStyleDeclaration, r: DOMRect, opacity: number, dpr: number) {
  const bg = cs.backgroundColor
  const bwid = parseFloat(cs.borderTopWidth) || 0
  const bcol = cs.borderTopColor
  const hasBg = alphaOf(bg) > 0
  const hasBorder = bwid > 0 && cs.borderTopStyle !== "none" && alphaOf(bcol) > 0
  const shadow = parseShadow(cs.boxShadow)
  if (!hasBg && !hasBorder && !shadow) return
  const rad = radiusOf(cs, r)
  ctx.save()
  ctx.globalAlpha = opacity
  if (shadow) {
    // Canvas draws a shadow only under painted pixels; CSS draws it outside
    // the box whatever the fill. Paint the box far away and throw its
    // shadow back into place, clipped to outside the box.
    const far = 100000
    ctx.save()
    ctx.beginPath()
    ctx.rect(-far, -far, far * 3, far * 3)
    roundRectPath(ctx, r.left, r.top, r.width, r.height, rad)
    ctx.clip("evenodd")
    ctx.shadowColor = shadow.color
    ctx.shadowBlur = shadow.blur * dpr
    ctx.shadowOffsetX = (shadow.x + far) * dpr
    ctx.shadowOffsetY = shadow.y * dpr
    ctx.fillStyle = "#000"
    ctx.beginPath()
    const s = shadow.spread
    roundRectPath(ctx, r.left - s - far, r.top - s, r.width + 2 * s, r.height + 2 * s, rad + s)
    ctx.fill()
    ctx.restore()
  }
  if (hasBg) {
    ctx.fillStyle = bg
    ctx.beginPath()
    roundRectPath(ctx, r.left, r.top, r.width, r.height, rad)
    ctx.fill()
  }
  if (hasBorder) {
    ctx.strokeStyle = bcol
    ctx.lineWidth = bwid
    ctx.beginPath()
    roundRectPath(ctx, r.left + bwid / 2, r.top + bwid / 2, r.width - bwid, r.height - bwid, Math.max(0, rad - bwid / 2))
    ctx.stroke()
  }
  ctx.restore()
}

// ── Text ─────────────────────────────────────────────────────────────────

function transformText(ch: string, t: string): string {
  if (t === "uppercase") return ch.toUpperCase()
  if (t === "lowercase") return ch.toLowerCase()
  return ch
}

function drawText(
  ctx: CanvasRenderingContext2D,
  node: Text,
  parent: HTMLElement,
  cs: CSSStyleDeclaration,
  opacity: number,
  range: Range,
  dpr: number
) {
  const text = node.data
  if (!text.trim()) return
  // Scale transforms (hover, dissolve) show in the parent's box but not in
  // its computed font size.
  const pr = parent.getBoundingClientRect()
  const scale = parent.offsetWidth > 0 ? pr.width / parent.offsetWidth : 1
  const size = (parseFloat(cs.fontSize) || 16) * scale
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = cs.color
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`
  ctx.textBaseline = "alphabetic"
  const shadow = parseShadow(cs.textShadow)
  if (shadow) {
    ctx.shadowColor = shadow.color
    ctx.shadowBlur = shadow.blur * dpr
    ctx.shadowOffsetX = shadow.x * dpr
    ctx.shadowOffsetY = shadow.y * dpr
  }
  const m = ctx.measureText("Mg")
  const ascent = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent || size * 0.8
  const descent = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent || size * 0.2
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // Keep surrogate pairs (emoji, some arrows) together.
    const len = code >= 0xd800 && code <= 0xdbff && i + 1 < text.length ? 2 : 1
    const ch = text.slice(i, i + len)
    if (/\s/.test(ch)) {
      i += len - 1
      continue
    }
    range.setStart(node, i)
    range.setEnd(node, i + len)
    const rect = range.getClientRects()[0]
    i += len - 1
    if (!rect || rect.width === 0) continue
    const baseline = rect.top + (rect.height - (ascent + descent)) / 2 + ascent
    ctx.fillText(transformText(ch, cs.textTransform), rect.left, baseline)
  }
  ctx.restore()
}

// ── Media ────────────────────────────────────────────────────────────────

function drawMedia(
  ctx: CanvasRenderingContext2D,
  el: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  cs: CSSStyleDeclaration,
  r: DOMRect,
  opacity: number
) {
  let nw = 0
  let nh = 0
  if (el instanceof HTMLImageElement) {
    if (!el.complete) return
    nw = el.naturalWidth
    nh = el.naturalHeight
  } else if (el instanceof HTMLVideoElement) {
    if (el.readyState < 2) return
    nw = el.videoWidth
    nh = el.videoHeight
  } else {
    nw = el.width
    nh = el.height
  }
  if (!nw || !nh) return
  const bl = parseFloat(cs.borderLeftWidth) || 0
  const bt = parseFloat(cs.borderTopWidth) || 0
  const x = r.left + bl
  const y = r.top + bt
  const w = r.width - bl - (parseFloat(cs.borderRightWidth) || 0)
  const h = r.height - bt - (parseFloat(cs.borderBottomWidth) || 0)
  if (w <= 0 || h <= 0) return
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.beginPath()
  roundRectPath(ctx, r.left, r.top, r.width, r.height, radiusOf(cs, r))
  ctx.clip()
  try {
    const fit = cs.objectFit
    if (fit === "cover" || fit === "contain" || fit === "scale-down") {
      let k = fit === "cover" ? Math.max(w / nw, h / nh) : Math.min(w / nw, h / nh)
      if (fit === "scale-down") k = Math.min(1, k)
      const dw = nw * k
      const dh = nh * k
      ctx.drawImage(el, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
    } else {
      ctx.drawImage(el, x, y, w, h)
    }
  } catch {
    // An image that failed to decode draws nothing.
  }
  ctx.restore()
}

// ── Inline SVG ───────────────────────────────────────────────────────────

function drawSvg(ctx: CanvasRenderingContext2D, svg: SVGSVGElement, opacity: number) {
  const r = svg.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return
  const vb = svg.viewBox?.baseVal
  const vx = vb && vb.width ? vb.x : 0
  const vy = vb && vb.width ? vb.y : 0
  const vw = vb && vb.width ? vb.width : r.width
  const vh = vb && vb.height ? vb.height : r.height
  const s = Math.min(r.width / vw, r.height / vh)
  ctx.save()
  ctx.translate(r.left + (r.width - vw * s) / 2 - vx * s, r.top + (r.height - vh * s) / 2 - vy * s)
  ctx.scale(s, s)
  drawSvgChildren(ctx, svg, opacity)
  ctx.restore()
}

const num = (el: Element, name: string) => parseFloat(el.getAttribute(name) || "0") || 0
/** A computed opacity-like value; missing or invalid means fully opaque. */
const unit = (v: string) => {
  const f = parseFloat(v)
  return Number.isNaN(f) ? 1 : f
}

function svgPath(el: Element): Path2D | null {
  const tag = el.tagName.toLowerCase()
  if (tag === "path") return new Path2D(el.getAttribute("d") || "")
  const p = new Path2D()
  if (tag === "line") {
    p.moveTo(num(el, "x1"), num(el, "y1"))
    p.lineTo(num(el, "x2"), num(el, "y2"))
  } else if (tag === "circle") {
    p.arc(num(el, "cx"), num(el, "cy"), num(el, "r"), 0, Math.PI * 2)
  } else if (tag === "ellipse") {
    p.ellipse(num(el, "cx"), num(el, "cy"), num(el, "rx"), num(el, "ry"), 0, 0, Math.PI * 2)
  } else if (tag === "rect") {
    const rx = num(el, "rx") || num(el, "ry")
    roundRectPath(p, num(el, "x"), num(el, "y"), num(el, "width"), num(el, "height"), rx)
  } else if (tag === "polyline" || tag === "polygon") {
    const pts = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number)
    for (let i = 0; i + 1 < pts.length; i += 2) {
      if (i === 0) p.moveTo(pts[0], pts[1])
      else p.lineTo(pts[i], pts[i + 1])
    }
    if (tag === "polygon") p.closePath()
  } else {
    return null
  }
  return p
}

function drawSvgChildren(ctx: CanvasRenderingContext2D, parent: Element, opacityIn: number) {
  for (const el of Array.from(parent.children)) {
    const cs = getComputedStyle(el)
    if (cs.display === "none" || cs.visibility === "hidden") continue
    const opacity = opacityIn * (parseFloat(cs.opacity) || 0)
    if (opacity < 0.004) continue
    if (el.tagName.toLowerCase() === "g") {
      drawSvgChildren(ctx, el, opacity)
      continue
    }
    const path = svgPath(el)
    if (!path) continue
    if (cs.fill && cs.fill !== "none" && !cs.fill.startsWith("url(")) {
      ctx.globalAlpha = opacity * unit(cs.fillOpacity)
      ctx.fillStyle = cs.fill
      ctx.fill(path, cs.fillRule === "evenodd" ? "evenodd" : "nonzero")
    }
    if (cs.stroke && cs.stroke !== "none" && !cs.stroke.startsWith("url(")) {
      ctx.globalAlpha = opacity * unit(cs.strokeOpacity)
      ctx.strokeStyle = cs.stroke
      ctx.lineWidth = parseFloat(cs.strokeWidth) || 1
      ctx.lineCap = (cs.strokeLinecap as CanvasLineCap) || "butt"
      ctx.lineJoin = (cs.strokeLinejoin as CanvasLineJoin) || "miter"
      ctx.stroke(path)
    }
  }
}
