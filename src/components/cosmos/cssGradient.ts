/**
 * Reads a computed CSS `radial-gradient(...)` background so the home snapshot
 * can paint it on a canvas (the title's dark backdrop). Pure, so Node tests
 * run it.
 *
 * Covers the centered, farthest-corner form (the CSS default) as an ellipse
 * or a circle, with color stops in percent. Other forms return null, and the
 * snapshot leaves them out.
 */
export interface GradientStop {
  /** 0 to 1 along the gradient ray. */
  offset: number
  color: string
}

export interface RadialGradient {
  shape: "ellipse" | "circle"
  stops: GradientStop[]
}

/** Splits on the commas outside parentheses. */
function splitTop(s: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === "(") depth++
    else if (c === ")") depth--
    else if (c === "," && depth === 0) {
      out.push(s.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(s.slice(start).trim())
  return out
}

const SHAPES: Record<string, RadialGradient["shape"]> = {
  ellipse: "ellipse",
  "farthest-corner": "ellipse",
  "ellipse farthest-corner": "ellipse",
  circle: "circle",
  "circle farthest-corner": "circle",
}

const DESCRIPTOR = /^(circle|ellipse|closest-|farthest-|at\s|[\d.])/

/** One stop: a color, then at most one position in percent. */
function parseStop(text: string): { color: string; pos: number | null } | null {
  const fn = /^[a-z-]+\(/i.exec(text)
  let color: string
  let rest: string
  if (fn) {
    const end = text.indexOf(")", fn[0].length)
    if (end < 0) return null
    color = text.slice(0, end + 1)
    rest = text.slice(end + 1).trim()
  } else {
    const [head, ...tail] = text.split(/\s+/)
    color = head
    rest = tail.join(" ")
  }
  if (!rest) return { color, pos: null }
  const m = /^(-?[\d.]+)%$/.exec(rest) || (rest === "0" ? ["0", "0"] : null)
  return m ? { color, pos: parseFloat(m[1]) / 100 } : null
}

export function parseRadialGradient(value: string): RadialGradient | null {
  const v = value.trim()
  if (!v.startsWith("radial-gradient(") || !v.endsWith(")")) return null
  // One layer only: "radial-gradient(...), linear-gradient(...)" is two.
  if (splitTop(v).length !== 1) return null
  const args = splitTop(v.slice("radial-gradient(".length, -1))

  let shape: RadialGradient["shape"] = "ellipse"
  if (DESCRIPTOR.test(args[0])) {
    const desc = args[0].replace(/\s+/g, " ").replace(/\s*\bat (center|center center|50% 50%)$/, "").trim()
    if (desc !== "") {
      if (!(desc in SHAPES)) return null
      shape = SHAPES[desc]
    }
    args.shift()
  }

  const parsed = args.map(parseStop)
  if (parsed.length < 2 || parsed.some((s) => s === null)) return null
  const stops = parsed as { color: string; pos: number | null }[]

  // CSS fix-up: the ends default to 0 and 1, a stop never sits before an
  // earlier one, and stops without a position spread evenly between the
  // stops around them.
  if (stops[0].pos === null) stops[0].pos = 0
  if (stops[stops.length - 1].pos === null) stops[stops.length - 1].pos = 1
  let max = 0
  for (const s of stops) {
    if (s.pos !== null) {
      s.pos = Math.max(s.pos, max)
      max = s.pos
    }
  }
  for (let i = 1; i < stops.length; i++) {
    if (stops[i].pos !== null) continue
    let j = i
    while (stops[j].pos === null) j++
    const from = stops[i - 1].pos as number
    const to = stops[j].pos as number
    for (let k = i; k < j; k++) stops[k].pos = from + ((to - from) * (k - i + 1)) / (j - i + 1)
  }

  const out = stops.map((s) => ({ offset: s.pos as number, color: s.color }))
  if (out.some((s) => s.offset < 0 || s.offset > 1)) return null
  return { shape, stops: out }
}
