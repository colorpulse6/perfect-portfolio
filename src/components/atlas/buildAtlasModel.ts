/**
 * buildAtlasModel: the single place the Atlas turns Gatsby data into domains
 * and works. Pure: no asset imports, so Node can test it. Media resolution is
 * injected (the Atlas page passes resolveProjectMedia; the layout-level
 * topology query and the tests pass a stub).
 *
 * Every work gets a stable id `${domainId}:${slug(title)}` (repeats within a
 * domain get -2, -3, ... in source order). The WebGL stage builds its scene
 * from the small topology query and the Atlas page builds the full model from
 * its page query; both go through this function, so picks resolve by id.
 */
import { NB } from "./atlasShared.ts"
import type { AtlasDomain, AtlasWork, FictionStory, EssayItem, ChangelogItem } from "./atlasShared.ts"

export interface ProjectNode {
  name: string
  description?: string
  link?: string
  cta?: string | null
  secondaryLink?: string | null
  secondaryCta?: string | null
  github?: string | null
  imgSrc?: string
  techArray?: number[]
  ref?: string
  cluster: string
  status?: string
  medium?: string
  tech?: string[]
  disabled?: boolean
}

export interface WritingNode {
  title: string
  content?: string
}

export interface ChangelogNode {
  frontmatter: {
    title: string
    date: string
    type: string
    status?: string | null
    project?: string | null
    link?: string | null
    media?: string | null
  }
  excerpt?: string
}

export interface AtlasSourceData {
  projects: ProjectNode[]
  writing: WritingNode[]
  changelog: ChangelogNode[]
}

export interface AtlasModel {
  domains: AtlasDomain[]
  fiction: FictionStory[]
  essays: EssayItem[]
  changelog: ChangelogItem[]
}

export type MediaResolver = (name: string, imgSrc: string) => string | null

// CTA label by cluster, with a few per-project overrides where it reads better.
const CTA_CLUSTER: Record<string, string> = {
  obsidian: "Install",
  web: "Visit",
  games: "Play",
  tools: "Visit",
  ai: "Open",
  music: "Listen",
  sites: "Visit",
}
const CTA_NAME: Record<string, string> = {
  "El Form": "Docs",
  "Claude Skills": "GitHub",
  Throttle: "Download",
  "Knicks Knacks": "Open",
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Stable id for a work; `seen` de-duplicates repeated slugs within a build. */
export function workId(domainId: string, title: string, seen: Map<string, number>): string {
  const base = `${domainId}:${slugify(title)}`
  const n = (seen.get(base) || 0) + 1
  seen.set(base, n)
  return n === 1 ? base : `${base}-${n}`
}

// Curated bodies that aren't in allProject.
function curatedWorks(resolveMedia: MediaResolver): Record<string, AtlasWork[]> {
  return {
    obsidian: [
      {
        t: "Cerebro Mycelium",
        meta: "vault as a living fungal network",
        body: "Renders a vault as a living fungal network. Notes become soft kind-clusters, wikilinks become curved hyphae, and recent notes glow as fruiting bodies.",
        media: resolveMedia("Cerebro Mycelium", ""),
        medium: "OBSIDIAN PLUGIN",
        tech: ["TypeScript", "Canvas 2D", "Recency model"],
        status: "released",
        cta: "Install",
        link: "https://community.obsidian.md/plugins/cerebro-mycelium",
      },
    ],
    music: [
      {
        t: "Alex's Hand",
        meta: "10 years · 10 albums · 12 countries",
        body: "A decade as a composer and bandleader. Ten albums across twelve countries, leading a ten-piece ensemble through the US and Europe.",
        media: null,
        medium: "MUSIC",
        tech: [],
        status: "archive",
        cta: "Listen",
        link: "https://alexshand.bandcamp.com/",
      },
    ],
  }
}

export function buildAtlasModel(data: AtlasSourceData, opts: { resolveMedia: MediaResolver }): AtlasModel {
  const { resolveMedia } = opts
  const projects = data.projects
  const activeProjects = projects.filter(p => p.disabled !== true)
  const md = data.changelog
  const CURATED = curatedWorks(resolveMedia)

  const toWork = (p: ProjectNode): AtlasWork => {
    const cta = p.cta || CTA_NAME[p.name] || CTA_CLUSTER[p.cluster] || "Open"
    const link = p.link ?? null
    const links =
      p.name === "Sector Zero" && p.secondaryLink
        ? [
            { cta: "Play", link: link || "" },
            { cta: "Site", link: p.secondaryLink },
          ]
        : p.secondaryLink
          ? [
              { cta, link: link || "" },
              { cta: p.secondaryCta || "Site", link: p.secondaryLink },
            ]
          : undefined

    return {
      t: p.name,
      meta: p.description,
      body: p.description,
      media: resolveMedia(p.name, p.imgSrc || ""),
      medium: p.medium,
      tech: p.tech || [],
      status: p.status || "released",
      cta,
      link,
      links,
      github: p.github || null,
    }
  }
  const byCluster = (c: string) => activeProjects.filter(p => p.cluster === c).map(toWork)

  const essayNodes = md.filter(n => n.frontmatter.type === "writing")
  const essays: EssayItem[] = essayNodes.map(n => ({
    t: n.frontmatter.title,
    date: n.frontmatter.date,
    body: n.excerpt,
    link: n.frontmatter.link ?? null,
    media: n.frontmatter.media || null,
    status: n.frontmatter.status || "published",
  }))
  const essayWorks: AtlasWork[] = essayNodes.map(n => ({
    t: n.frontmatter.title,
    meta: n.excerpt,
    body: n.excerpt,
    link: n.frontmatter.link ?? null,
    cta: "Read",
    status: n.frontmatter.status || "published",
    date: n.frontmatter.date,
    media: n.frontmatter.media || null,
    shell: 0,
  }))

  const fiction: FictionStory[] = data.writing.map(w => ({
    title: w.title,
    content: w.content ?? "",
  }))

  const changelog: ChangelogItem[] = md.map(n => ({
    t: n.frontmatter.title,
    date: n.frontmatter.date,
    type: n.frontmatter.type,
    status: n.frontmatter.status ?? null,
    project: n.frontmatter.project ?? null,
  }))

  const obsidianWorks = [...byCluster("obsidian"), ...CURATED.obsidian]
  const webWorks = byCluster("web")
  const gamesWorks = byCluster("games")
  const toolsWorks = byCluster("tools")
  const aiWorks = byCluster("ai")
  const sitesWorks = byCluster("sites")
  const musicWorks = CURATED.music

  // Canonical hub order. EDGES in the renderers reference these indices:
  // [me, obsidian, web, games, tools, music, writing, ai, sites].
  const domains: AtlasDomain[] = [
    {
      id: "me",
      label: "NICHALAS BARNES",
      tag: "software engineer & composer",
      c: NB.indigo,
      p: [0, 0, 0],
      core: true,
      bio: "Seattle → Berlin → Madrid. A decade leading a 10-piece ensemble, now orchestrating systems and agents. The medium changed; the discipline didn't.",
    },
    { id: "obsidian", label: "OBSIDIAN", tag: "plugins", unit: "plugins", c: NB.cyan, p: [0.05, 0.78, 0.22], count: obsidianWorks.length, works: obsidianWorks },
    { id: "web", label: "WEB", tag: "web apps", unit: "apps", c: NB.blue, p: [0.82, 0.18, -0.25], count: webWorks.length, works: webWorks },
    { id: "games", label: "GAMES", tag: "builds", unit: "builds", c: NB.pink, p: [-0.84, 0.3, 0.1], count: gamesWorks.length, works: gamesWorks },
    { id: "tools", label: "TOOLS", tag: "libraries · SDKs", unit: "tools", c: NB.steel, p: [0.4, -0.62, 0.42], count: toolsWorks.length, works: toolsWorks },
    { id: "music", label: "MUSIC", tag: "Alex's Hand", unit: "albums", c: "#f2ab47", warm: true, p: [-0.52, -0.52, -0.34], count: 10, works: musicWorks },
    {
      id: "writing",
      label: "WRITING",
      tag: "essays + fiction",
      unit: "pieces",
      c: NB.lilac,
      p: [0.3, 0.42, -0.82],
      shells: ["ESSAYS", "FICTION"],
      count: essays.length + fiction.length,
      works: essayWorks,
    },
    { id: "ai", label: "AI", tag: "agent orchestration", unit: "systems", c: NB.purple, p: [-0.3, -0.2, 0.66], count: aiWorks.length, works: aiWorks },
    { id: "sites", label: "SITES", tag: "live web destinations", unit: "sites", c: "#46c79c", p: [0.6, -0.25, -0.72], count: sitesWorks.length, works: sitesWorks },
  ]

  const seen = new Map<string, number>()
  for (const d of domains) for (const w of d.works || []) w.id = workId(d.id, w.t, seen)

  return { domains, fiction, essays, changelog }
}
