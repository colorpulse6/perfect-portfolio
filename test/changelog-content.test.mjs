import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function readChangelogEntry(slug) {
  return fs.readFileSync(
    path.join(rootDir, "content", "changelog", `${slug}.md`),
    "utf8"
  )
}

function frontmatterValue(markdown, key) {
  const match = markdown.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))
  return match?.[1]?.replace(/^"|"$/g, "")
}

function assertFeaturedPluginEntry({ slug, title, link, media, bodyPattern, cta = "Install", date }) {
  const markdown = readChangelogEntry(slug)

  assert.equal(frontmatterValue(markdown, "title"), title)
  if (date) assert.equal(frontmatterValue(markdown, "date"), date)
  assert.equal(
    frontmatterValue(markdown, "link"),
    link
  )
  assert.equal(frontmatterValue(markdown, "status"), "released")
  assert.equal(frontmatterValue(markdown, "featured"), "true")
  assert.equal(frontmatterValue(markdown, "media"), media)
  assert.equal(frontmatterValue(markdown, "cta"), cta)
  assert.equal(
    fs.existsSync(path.join(rootDir, "src", "images", frontmatterValue(markdown, "media"))),
    true
  )
  assert.match(markdown, bodyPattern)
}

test("Brain Atlas changelog entry is featured for floating project cards", () => {
  assertFeaturedPluginEntry({
    slug: "brain-atlas",
    title: "Brain Atlas: Obsidian Plugin",
    date: "2026-05-31",
    link: "https://community.obsidian.md/plugins/brain-atlas",
    media: "brain-atlas-spin.mp4",
    bodyPattern: /frontmatter value mappings/i,
  })
})

test("Throttle changelog entry uses the actual release date and dashboard screenshot", () => {
  assertFeaturedPluginEntry({
    slug: "throttle",
    title: "Throttle v1.0.0",
    date: "2026-05-18",
    link: "https://github.com/colorpulse6/throttle/releases/tag/v1.0.0",
    media: "throttle-dashboard.png",
    cta: "Download",
    bodyPattern: /Claude Max and Codex Pro usage limits/i,
  })
})

test("Cerebro Mycelium changelog entry is featured for floating project cards", () => {
  assertFeaturedPluginEntry({
    slug: "cerebro-mycelium",
    title: "Cerebro Mycelium: Obsidian Plugin",
    link: "https://community.obsidian.md/plugins/cerebro-mycelium",
    media: "cerebro-mycelium.mp4",
    bodyPattern: /living fungal network/i,
  })
})

test("Cerebro changelog entry is featured as an in-progress macOS project", () => {
  const markdown = readChangelogEntry("cerebro")

  assert.equal(frontmatterValue(markdown, "title"), "Cerebro: macOS Agent Workspace")
  assert.equal(frontmatterValue(markdown, "date"), "2026-05-30")
  assert.equal(frontmatterValue(markdown, "link"), "https://github.com/colorpulse6/cerebro-orchestra")
  assert.equal(frontmatterValue(markdown, "status"), "in-progress")
  assert.equal(frontmatterValue(markdown, "featured"), "true")
  assert.equal(frontmatterValue(markdown, "project"), "macOS")
  assert.equal(frontmatterValue(markdown, "media"), "cerebro-dashboard.png")
  assert.equal(frontmatterValue(markdown, "cta"), "View")
  assert.equal(
    fs.existsSync(path.join(rootDir, "src", "images", frontmatterValue(markdown, "media"))),
    true
  )
  assert.match(markdown, /native macOS multi-agent workspace/i)
})

test("Sector Zero changelog entry uses the cockpit screenshot", () => {
  const markdown = readChangelogEntry("sector-zero-new-modes")

  assert.equal(frontmatterValue(markdown, "title"), "Sector Zero: New Playable Modes")
  assert.equal(frontmatterValue(markdown, "link"), "https://colorpulse6.github.io/knicks-knacks/sector-zero/")
  assert.equal(frontmatterValue(markdown, "status"), "in-progress")
  assert.equal(frontmatterValue(markdown, "featured"), "true")
  assert.equal(frontmatterValue(markdown, "project"), "Knicks Knacks")
  assert.equal(frontmatterValue(markdown, "media"), "sector-zero.jpg")
  assert.equal(
    fs.existsSync(path.join(rootDir, "src", "images", frontmatterValue(markdown, "media"))),
    true
  )
  assert.match(markdown, /three new playable modes/i)
})
