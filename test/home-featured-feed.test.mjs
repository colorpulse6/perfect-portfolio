import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

test("home page floating cards only use featured changelog entries", () => {
  const source = fs.readFileSync(path.join(rootDir, "src", "pages", "index.tsx"), "utf8")

  assert.match(source, /\.filter\(\(n\) => n\.frontmatter\.featured === true\)/)
})
