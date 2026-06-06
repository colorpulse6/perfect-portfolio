import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function readSource(...parts) {
  return fs.readFileSync(path.join(rootDir, ...parts), "utf8")
}

function ruleBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = css.match(new RegExp(`${escaped}\\s*\\{(?<body>[^}]*)\\}`, "m"))
  assert.ok(match?.groups?.body, `Expected ${selector} rule to exist`)
  return match.groups.body
}

test("atlas mounts a project rail that opens project wraith panels", () => {
  const canvas = readSource("src", "components", "atlas", "AtlasCanvas.tsx")

  assert.match(canvas, /import \{ ProjectRail \} from "\.\/ProjectRail"/)
  assert.match(canvas, /<ProjectRail[\s\S]*domains=\{domains\}/)
  assert.match(canvas, /hidden=\{entered >= 0 \|\| !!panel\}/)
  assert.match(canvas, /onOpen=\{\(work, domain\) => setPanel\(\{ type: "project", work, domain \}\)\}/)
})

test("project rail uses project domains and renders real image or video thumbnails", () => {
  const rail = readSource("src", "components", "atlas", "ProjectRail.tsx")

  assert.match(rail, /PROJECT_RAIL_DOMAIN_IDS/)
  assert.match(rail, /PROJECT_RAIL_DOMAIN_IDS\.has\(domain\.id\)/)
  assert.match(rail, /import \{ isVideo \} from "\.\.\/\.\.\/helpers\/projectImages"/)
  assert.match(rail, /const media = it\.work\.media/)
  assert.match(rail, /isVideo\(media\)/)
  assert.match(rail, /<video[\s\S]*src=\{media\}[\s\S]*autoPlay[\s\S]*loop[\s\S]*muted[\s\S]*playsInline/)
  assert.match(rail, /<img[\s\S]*src=\{media\}[\s\S]*alt=\{``\}/)
})

test("atlas Sector Zero work uses the cockpit screenshot", () => {
  const atlasPage = readSource("src", "pages", "atlas.tsx")
  const projectImages = readSource("src", "helpers", "projectImages.ts")

  const nodeSource = readSource("gatsby-node.js")

  assert.match(atlasPage, /media: resolveProjectMedia\(p\.name, p\.imgSrc\)/)
  assert.match(nodeSource, /name: "Sector Zero"[\s\S]*imgSrc: "sector-zero\.jpg"/)
  assert.match(projectImages, /import SectorZeroImg from "\.\.\/images\/sector-zero\.jpg"/)
  assert.match(projectImages, /"Sector Zero": SectorZeroImg/)
})

test("project rail remains unobtrusive and accessible", () => {
  const rail = readSource("src", "components", "atlas", "ProjectRail.tsx")
  const css = readSource("src", "components", "atlas", "projectRail.css")

  assert.match(rail, /const manual = reduce \|\| hovering/)
  assert.match(rail, /const rendered = manual \? items : \[\.\.\.items, \.\.\.items\]/)
  assert.match(rail, /tabIndex=\{i < items\.length \? 0 : -1\}/)
  assert.match(ruleBlock(css, ".atlas-rail"), /pointer-events:\s*auto/)
  assert.match(ruleBlock(css, ".atlas-rail__card"), /pointer-events:\s*auto/)
  assert.match(ruleBlock(css, ".atlas-rail__track"), /position:\s*static/)
  assert.match(ruleBlock(css, ".atlas-rail__track"), /animation:\s*atlas-rail-roll\s+52s\s+linear\s+infinite/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none/)
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*display:\s*none/)
})

test("project rail card metadata stays aligned and the rail is scrollable while hovered", () => {
  const rail = readSource("src", "components", "atlas", "ProjectRail.tsx")
  const css = readSource("src", "components", "atlas", "projectRail.css")

  assert.match(rail, /onMouseEnter=\{\(\) => setManual\(true\)\}/)
  assert.match(rail, /onMouseLeave=\{\(\) => setManual\(false\)\}/)
  assert.match(rail, /const rendered = manual \? items : \[\.\.\.items, \.\.\.items\]/)
  assert.match(rail, /<span className="atlas-rail__sub-text">\{sub\}<\/span>/)
  assert.match(ruleBlock(css, ".atlas-rail:hover"), /overflow-y:\s*auto/)
  assert.match(ruleBlock(css, ".atlas-rail--manual .atlas-rail__track"), /position:\s*static/)
  assert.match(ruleBlock(css, ".atlas-rail__sub"), /white-space:\s*nowrap/)
  assert.match(ruleBlock(css, ".atlas-rail__sub"), /line-height:\s*1\.35/)
  assert.match(ruleBlock(css, ".atlas-rail__sub-text"), /text-overflow:\s*ellipsis/)
})
