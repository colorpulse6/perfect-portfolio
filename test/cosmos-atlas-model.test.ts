import { test } from "node:test"
import assert from "node:assert/strict"
import { buildAtlasModel, slugify } from "../src/components/atlas/buildAtlasModel.ts"
import type { AtlasSourceData } from "../src/components/atlas/buildAtlasModel.ts"

const full: AtlasSourceData = {
  projects: [
    { name: "Brain Atlas", description: "vault as a brain", link: "https://a", github: null, imgSrc: "brain.png", cluster: "obsidian", status: "released", medium: "OBSIDIAN PLUGIN", tech: ["TS"] },
    { name: "Job Toast", description: "jobs", link: "https://b", github: null, imgSrc: "jt.png", cluster: "web", status: "live", medium: "WEB APP", tech: [] },
    { name: "Gigzilla", description: "old", link: "https://c", github: null, imgSrc: "g.png", cluster: "web", status: "archive", medium: "WEB APP", tech: [], disabled: true },
    { name: "Sector Zero", description: "space", link: "https://d", secondaryLink: "https://site", github: null, imgSrc: "sz.jpg", cluster: "games", status: "in-progress", medium: "BROWSER GAME", tech: [] },
    { name: "Cerebro", description: "agents", link: "https://e", github: null, imgSrc: "c.png", cluster: "ai", status: "released", medium: "macOS APP", tech: [] },
  ],
  writing: [
    { title: "Story One", content: "Once." },
    { title: "Story Two", content: "Twice." },
  ],
  changelog: [
    { frontmatter: { title: "Agile Anarchy", date: "2026-05-01", type: "writing", status: "published", project: null, link: "https://m", media: null }, excerpt: "An essay." },
    { frontmatter: { title: "Agile Anarchy", date: "2026-04-01", type: "writing", status: "published", project: null, link: "https://m2", media: null }, excerpt: "A rerun." },
    { frontmatter: { title: "Shipped a thing", date: "2026-03-01", type: "update", status: null, project: "Job Toast", link: null, media: null }, excerpt: "Update." },
  ],
}

// The layout-level topology query carries names and statuses but no prose.
const topology: AtlasSourceData = {
  projects: full.projects.map(({ name, cluster, status, medium, imgSrc, disabled }) => ({ name, cluster, status, medium, imgSrc, disabled })),
  writing: full.writing.map(({ title }) => ({ title })),
  changelog: full.changelog.map(({ frontmatter }) => ({ frontmatter })),
}

const mediaCalls: string[] = []
const resolveMedia = (name: string) => {
  mediaCalls.push(name)
  return `media:${name}`
}

test("domains come out in the canonical hub order", () => {
  const m = buildAtlasModel(full, { resolveMedia })
  assert.deepEqual(m.domains.map((d) => d.id), ["me", "obsidian", "web", "games", "tools", "music", "writing", "ai", "sites"])
})

test("disabled projects never reach a domain", () => {
  const m = buildAtlasModel(full, { resolveMedia })
  const web = m.domains.find((d) => d.id === "web")!
  assert.deepEqual(web.works!.map((w) => w.t), ["Job Toast"])
})

test("every work has a unique stable id and repeated titles get a suffix", () => {
  const m = buildAtlasModel(full, { resolveMedia })
  const ids = m.domains.flatMap((d) => (d.works || []).map((w) => w.id))
  assert.ok(ids.every((id) => typeof id === "string" && id.length > 0))
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(ids.includes("writing:agile-anarchy"))
  assert.ok(ids.includes("writing:agile-anarchy-2"))
  assert.ok(ids.includes("obsidian:cerebro-mycelium"))
  assert.ok(ids.includes("music:alex-s-hand"))
})

test("topology and full builds agree on ids and counts", () => {
  const a = buildAtlasModel(full, { resolveMedia: () => null })
  const b = buildAtlasModel(topology, { resolveMedia: () => null })
  const flat = (m: typeof a) => m.domains.map((d) => [d.id, d.count, (d.works || []).map((w) => w.id)])
  assert.deepEqual(flat(b), flat(a))
  assert.equal(b.fiction.length, 2)
})

test("media resolution is injected, including curated works", () => {
  mediaCalls.length = 0
  const m = buildAtlasModel(full, { resolveMedia })
  assert.ok(mediaCalls.includes("Brain Atlas"))
  assert.ok(mediaCalls.includes("Cerebro Mycelium"))
  const obsidian = m.domains.find((d) => d.id === "obsidian")!
  assert.equal(obsidian.works![0].media, "media:Brain Atlas")
})

test("slugify is stable and url-safe", () => {
  assert.equal(slugify("Alex's Hand"), "alex-s-hand")
  assert.equal(slugify("  El Form!  "), "el-form")
  assert.equal(slugify("Throttle"), "throttle")
})
