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

test("the first Cerebro entry stays as in-progress history, off the home cards", () => {
  const markdown = readChangelogEntry("cerebro")

  assert.equal(frontmatterValue(markdown, "title"), "Cerebro: macOS Agent Workspace")
  assert.equal(frontmatterValue(markdown, "date"), "2026-05-30")
  assert.equal(frontmatterValue(markdown, "status"), "in-progress")
  assert.equal(frontmatterValue(markdown, "featured"), "false")
  assert.match(markdown, /native macOS multi-agent workspace/i)
})

test("Cerebro public beta entry is featured with its download link and product shot", () => {
  const markdown = readChangelogEntry("cerebro-public-beta")

  assert.equal(frontmatterValue(markdown, "title"), "Cerebro: Public Beta for macOS")
  assert.equal(frontmatterValue(markdown, "date"), "2026-09-22")
  assert.equal(frontmatterValue(markdown, "link"), "https://trycerebro.com/download")
  assert.equal(frontmatterValue(markdown, "cta"), "Download")
  assert.equal(frontmatterValue(markdown, "secondaryLink"), "https://trycerebro.com/")
  assert.equal(frontmatterValue(markdown, "status"), "released")
  assert.equal(frontmatterValue(markdown, "featured"), "true")
  assert.equal(frontmatterValue(markdown, "project"), "macOS")
  assert.equal(frontmatterValue(markdown, "media"), "cerebro-mission.jpg")
  assert.match(markdown, /macOS 14 or newer on Apple silicon/)
})

test("every featured entry has preview media the home cards can show", () => {
  const cardSource = fs.readFileSync(
    path.join(rootDir, "src", "components", "nebula", "cardRendering.ts"),
    "utf8"
  )
  const mediaAssets = cardSource.match(/MEDIA_ASSETS[^{]*\{([^}]*)\}/)[1]
  const dir = path.join(rootDir, "content", "changelog")
  const featured = fs
    .readdirSync(dir)
    .filter(file => file.endsWith(".md"))
    .map(file => [file, fs.readFileSync(path.join(dir, file), "utf8")])
    .filter(([, markdown]) => frontmatterValue(markdown, "featured") === "true")

  assert.ok(featured.length >= 5, "the home page has cards to show")
  for (const [file, markdown] of featured) {
    const media = frontmatterValue(markdown, "media")
    assert.ok(media, `${file} is featured but has no media`)
    assert.ok(fs.existsSync(path.join(rootDir, "src", "images", media)), `${file}: src/images/${media} is missing`)
    assert.ok(mediaAssets.includes(`"${media}"`), `${file}: ${media} is not mapped in MEDIA_ASSETS`)
  }
})

test("Sector Zero changelog entry uses the cockpit screenshot", () => {
  const markdown = readChangelogEntry("sector-zero-new-modes")

  assert.equal(frontmatterValue(markdown, "title"), "Sector Zero: New Playable Modes")
  assert.equal(frontmatterValue(markdown, "link"), "https://colorpulse6.github.io/sector-zero/")
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
