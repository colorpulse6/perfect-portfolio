import test from "node:test"
import assert from "node:assert/strict"
import { SCENES, PRODUCTS, TOOLS, ESSAYS, TECH_ICON, CHIMERA } from "../src/components/scroll/data/content.ts"
import { formatDate } from "../src/components/scroll/data/formatDate.ts"

test("curated content follows the approved scenes and product selection", () => {
  assert.equal(SCENES.length, 11)
  assert.equal(PRODUCTS.length, 7)
  assert.equal(PRODUCTS[0], "Chimera")
  assert.equal(TOOLS.length, 5)
  assert.equal(ESSAYS.length, 2)
  assert.deepEqual(CHIMERA.tech, ["Unreal Engine 5", "Astro"])
  assert.equal(TECH_ICON["Unreal Engine 5"], "unrealengine")
  assert.equal(formatDate("2026-10-16"), "16 October 2026")
})
