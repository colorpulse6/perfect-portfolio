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
    link: "https://community.obsidian.md/plugins/brain-atlas",
    media: "brain-atlas-spin.gif",
    bodyPattern: /native inside Obsidian/i,
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
    media: "cerebro-mycelium.gif",
    bodyPattern: /living fungal network/i,
  })
})
