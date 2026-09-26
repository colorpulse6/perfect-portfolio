import { test } from "node:test"
import assert from "node:assert/strict"

test("cosmos test lane runs TypeScript", () => {
  const n: number = 2
  assert.equal(n * 2, 4)
})
