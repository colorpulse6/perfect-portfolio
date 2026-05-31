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
