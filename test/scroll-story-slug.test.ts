import test from "node:test"
import assert from "node:assert/strict"
import { storySlug, storyFromHash } from "../src/helpers/storySlug.ts"
import { createRequire } from "node:module"

test("story slugs match the Gatsby node rule", () => {
  assert.equal(storySlug("The World Is a Coed Bathroom"), "the-world-is-a-coed-bathroom")
  assert.equal(storySlug("  A Priority!! "), "a-priority")
  assert.equal(storyFromHash("#jerks", ["A Priority", "Jerks"]), "Jerks")
  assert.equal(storyFromHash("#missing", ["Jerks"]), null)
})

test("all Gatsby story titles get distinct addresses", () => {
  const nodes: Array<{ title?: string; internal: { type: string } }> = []
  createRequire(import.meta.url)("../gatsby-node.js").sourceNodes({
    actions: { createNode: (node: typeof nodes[number]) => nodes.push(node) },
    createNodeId: (value: string) => value,
    createContentDigest: () => "digest",
  })
  const titles = nodes.filter(node => node.internal.type === "Writing").map(node => node.title ?? "")
  const slugs = titles.map(storySlug)
  assert.equal(titles.length, 17)
  assert.equal(new Set(slugs).size, 17)
  assert.ok(slugs.every(Boolean))
  assert.equal(storyFromHash("#jerks", titles), "Jerks")
})
