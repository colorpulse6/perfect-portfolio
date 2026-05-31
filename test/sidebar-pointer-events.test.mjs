import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function ruleBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = css.match(new RegExp(`${escaped}\\s*\\{(?<body>[^}]*)\\}`, "m"))
  assert.ok(match?.groups?.body, `Expected ${selector} rule to exist`)
  return match.groups.body
}

test("collapsed sidebar only captures pointer events on actual nav items", () => {
  const css = fs.readFileSync(
    path.join(rootDir, "src", "components", "sidebar.css"),
    "utf8"
  )

  assert.match(ruleBlock(css, ".sidebar-collapsed"), /pointer-events:\s*none/)
  assert.match(ruleBlock(css, ".sidebar-collapsed__item"), /pointer-events:\s*auto/)
})
