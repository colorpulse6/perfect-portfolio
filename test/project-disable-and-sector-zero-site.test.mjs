import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const { sourceNodes } = require("../gatsby-node.js")
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function readSource(...parts) {
  return fs.readFileSync(path.join(rootDir, ...parts), "utf8")
}

function loadProjectNodes() {
  const nodes = []

  sourceNodes({
    actions: {
      createNode: node => nodes.push(node),
    },
    createNodeId: value => value,
    createContentDigest: value => JSON.stringify(value),
  })

  return nodes.filter(node => node.internal.type === "Project")
}

function readChangelogEntry(slug) {
  return fs.readFileSync(path.join(rootDir, "content", "changelog", `${slug}.md`), "utf8")
}

function frontmatterValue(markdown, key) {
  const match = markdown.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))
  return match?.[1]?.replace(/^"|"$/g, "")
}

test("disabled projects stay in source data but are not emitted as portfolio project nodes", () => {
  const nodeSource = readSource("gatsby-node.js")
  const projects = loadProjectNodes()
  const names = projects.map(project => project.name)

  assert.match(nodeSource, /name: "Hoop\.It\.App"[\s\S]*disabled: true/)
  assert.match(nodeSource, /name: "Gigzilla"[\s\S]*disabled: true/)
  assert.match(nodeSource, /projects\.filter\(project => project\.disabled !== true\)/)
  assert.equal(names.includes("Hoop.It.App"), false)
  assert.equal(names.includes("Gigzilla"), false)
  assert.ok(names.includes("Fire Store"))
})

test("atlas defensively filters disabled projects from domain work lists", () => {
  const atlasPage = readSource("src", "pages", "atlas.tsx")

  assert.match(atlasPage, /disabled\?: boolean/)
  assert.match(atlasPage, /const activeProjects = projects\.filter\(p => p\.disabled !== true\)/)
  assert.match(atlasPage, /activeProjects\.filter\(p => p\.cluster === c\)\.map\(toWork\)/)
})

test("Sector Zero exposes a Site action next to Play in atlas and featured cards", () => {
  const atlasShared = readSource("src", "components", "atlas", "atlasShared.ts")
  const atlasPage = readSource("src", "pages", "atlas.tsx")
  const projectComponent = readSource("src", "components", "Project.tsx")
  const projectTemplate = readSource("src", "templates", "project.tsx")
  const wProject = readSource("src", "components", "atlas", "panels", "WProject.tsx")
  const indexPage = readSource("src", "pages", "index.tsx")
  const domArtifacts = readSource("src", "components", "nebula", "DomArtifacts.tsx")
  const markdown = readChangelogEntry("sector-zero-new-modes")

  assert.match(atlasShared, /links\?: AtlasWorkLink\[\]/)
  assert.match(atlasPage, /p\.name === "Sector Zero"[\s\S]*cta: "Play"[\s\S]*cta: "Site"/)
  assert.match(wProject, /const links = work\?\.links\?\.length[\s\S]*work\.links/)
  assert.match(wProject, /links\.map\(\(\{ cta, link \}\) =>/)
  assert.match(projectComponent, /secondaryLink\?: string/)
  assert.match(projectComponent, /secondaryCta \|\| "Site"/)
  assert.match(projectTemplate, /secondaryLink/)
  assert.match(projectTemplate, /\{p\.cta \|\| "Visit"\} ↗/)
  assert.equal(frontmatterValue(markdown, "cta"), "Play")
  assert.equal(frontmatterValue(markdown, "secondaryCta"), "Site")
  assert.equal(frontmatterValue(markdown, "secondaryLink"), "https://colorpulse6.github.io/sector-zero/site/")
  assert.match(indexPage, /secondaryLink: n\.frontmatter\.secondaryLink/)
  assert.match(domArtifacts, /entry\.secondaryLink[\s\S]*entry\.secondaryCta \|\| "Site"/)
})

test("Sector Zero is a regular portfolio project and Claude Skills does not render the Claude tech icon", () => {
  const projects = loadProjectNodes()
  const sectorZero = projects.find(project => project.name === "Sector Zero")
  const claudeSkills = projects.find(project => project.name === "Claude Skills")

  assert.ok(sectorZero)
  assert.equal(sectorZero.cluster, "games")
  assert.equal(sectorZero.link, "https://colorpulse6.github.io/knicks-knacks/sector-zero/")
  assert.equal(sectorZero.cta, "Play")
  assert.equal(sectorZero.secondaryLink, "https://colorpulse6.github.io/sector-zero/site/")
  assert.equal(sectorZero.secondaryCta, "Site")
  assert.equal(sectorZero.imgSrc, "sector-zero.jpg")
  assert.match(sectorZero.description, /procedural space survival/i)
  assert.ok(claudeSkills)
  assert.deepEqual(claudeSkills.techArray, [18, 30])
})
