// Shared palette, fonts, and color helpers for the Portfolio Atlas.
// Ported from the prototype's `portfolio-shared.jsx` — the browser `window`
// globals are gone; everything is exported normally so Gatsby can compile it.
//
// These are the exact values the prototype was tuned against (the design spec's
// prose names approximate colors; the source numbers below are authoritative).

export const NB = {
  // exact home particle palette (from particleThemes.ts, RGB → hex)
  indigo: "#633dc7",
  blue: "#3d63db",
  purple: "#8c4fd1",
  pink: "#c76ea1",
  steel: "#458cc7",
  cyan: "#4fb5db",
  lilac: "#c78cdb",
  // glitch channel split
  red: "#ff2b46",
  aqua: "#2bf0ff",
  // surfaces
  void: "#04040a",
  ink: "#070712",
  paper: "rgba(232,236,255,0.96)",
  faint: "rgba(190,200,240,0.55)",
  fainter: "rgba(160,172,220,0.32)",
  line: "rgba(150,170,255,0.12)",
} as const

export const NB_POOL: string[] = [
  NB.indigo,
  NB.blue,
  NB.purple,
  NB.pink,
  NB.steel,
  NB.cyan,
  NB.lilac,
]

export const NB_DISP = "'Space Grotesk', 'Montserrat', system-ui, sans-serif"
export const NB_MONO = "'JetBrains Mono', 'Courier New', ui-monospace, monospace"

export type RGB = [number, number, number]

// hex (#rrggbb) → [r, g, b], for additive canvas fills.
export function hx(h: string): RGB {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// ── Atlas data model (shared by the page, canvas, and panels) ─────────

export interface AtlasWorkLink {
  cta: string
  link: string
}

/** A body orbiting a cluster hub: a project, an essay, or a fiction story. */
export interface AtlasWork {
  t: string // title
  meta?: string // short one-line descriptor
  body?: string // full description (panel prose)
  media?: string | null // resolved screenshot URL/asset
  medium?: string | null // e.g. "macOS APP", "REACT LIBRARY"
  date?: string | null // for essays
  tech?: string[]
  status?: string // released | live | in-progress | published | archive
  cta?: string // OPEN | INSTALL | READ ...
  link?: string | null
  links?: AtlasWorkLink[]
  github?: string | null
  kind?: string // "story" for fiction sub-star entries
  fi?: number // index into the fiction[] array for story works
  shell?: number // writing cluster: 0 = essays (orbit), 1 = fiction (sub-star)
}

/** A galaxy cluster / hub. */
export interface AtlasDomain {
  id: string
  label: string
  tag?: string
  unit?: string
  c: string // accent hex
  p: number[] // unit-sphere position [x, y, z]
  count?: number
  core?: boolean
  warm?: boolean
  bio?: string
  shells?: string[] // sub-section labels, e.g. ["ESSAYS", "FICTION"]
  works?: AtlasWork[]
}

/** A fiction story (from allWriting) — full text fed to the reveal reader. */
export interface FictionStory {
  title: string
  content: string
}

/** An essay (allMarkdownRemark type=writing) — link-out. */
export interface EssayItem {
  t: string
  date?: string | null
  body?: string
  link?: string | null
  media?: string | null
  status?: string
}

/** A ship-log entry (allMarkdownRemark). */
export interface ChangelogItem {
  t: string
  date: string
  type: string
  status?: string | null
  project?: string | null
}
