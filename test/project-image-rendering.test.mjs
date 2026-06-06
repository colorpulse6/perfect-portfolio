import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

test("Throttle project image uses the portrait contain treatment", () => {
  const projectComponent = fs.readFileSync("src/components/Project.tsx", "utf8")
  const projectStyles = fs.readFileSync("src/pages/projects.css", "utf8")

  assert.match(projectComponent, /isPortraitProject/)
  assert.match(projectComponent, /project-images--portrait/)
  assert.match(projectStyles, /\.project-images--portrait\s*{[^}]*object-fit:\s*contain/s)
  assert.match(projectStyles, /\.project-images--portrait\s*{[^}]*aspect-ratio:\s*546\s*\/\s*962/s)
})

test("Cerebro project image uses the full-screenshot contain treatment", () => {
  const projectComponent = fs.readFileSync("src/components/Project.tsx", "utf8")
  const projectStyles = fs.readFileSync("src/pages/projects.css", "utf8")

  assert.match(projectComponent, /name === "Cerebro"[\s\S]*project-images--contain/)
  assert.match(projectStyles, /\.project-images--contain\s*{[^}]*object-fit:\s*contain/s)
  assert.match(projectStyles, /\.project-images--contain\s*{[^}]*background:\s*#070914/s)
})

test("shared project media resolver uses local preview clips before remote screenshots", () => {
  const projectImages = fs.readFileSync("src/helpers/projectImages.ts", "utf8")

  assert.match(projectImages, /HOVER_VIDEOS: Record<string, string>/)
  assert.match(projectImages, /return PRIMARY_VIDEOS\[name\] \|\| LOCAL_PRIMARY_IMAGES\[name\] \|\| HOVER_VIDEOS\[name\] \|\| imgSrc/)
})

test("project video previews do not use video files as posters", () => {
  const projectComponent = fs.readFileSync("src/components/Project.tsx", "utf8")

  assert.match(projectComponent, /import \{[\s\S]*isVideo[\s\S]*\} from "\.\.\/helpers\/projectImages"/)
  assert.match(projectComponent, /poster=\{HOVER_VIDEOS\[name\] && !isVideo\(image\) \? image : undefined\}/)
})

test("atlas rail thumbnails render media without screenshot-distorting blend effects", () => {
  const railStyles = fs.readFileSync("src/components/atlas/projectRail.css", "utf8")

  assert.doesNotMatch(railStyles, /mix-blend-mode/)
  assert.doesNotMatch(railStyles, /filter:\s*saturate/)
})
