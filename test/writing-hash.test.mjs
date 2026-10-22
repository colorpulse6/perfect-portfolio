import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("writing opens a known story from the URL hash and listens for hash changes", () => {
  const source = readFileSync(new URL("../src/pages/writing.tsx", import.meta.url), "utf8")
  assert.match(source, /storyFromHash/)
  assert.match(source, /window\.location\.hash/)
  assert.match(source, /addEventListener\("hashchange"/)
  assert.match(source, /removeEventListener\("hashchange"/)
})
