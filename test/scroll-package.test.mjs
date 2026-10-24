import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("scroll pure tests run in the strip-types lane", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)))
  assert.match(pkg.scripts["test:cosmos"], /test\/scroll-\*\.test\.ts/)
})
