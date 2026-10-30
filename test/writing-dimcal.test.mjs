import test from "node:test"
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"

const require = createRequire(import.meta.url)
const TITLE = "Is this for a blog or something?"

// The 2007 blog post, kept word for word. Misspellings and profanity are voice.
const TEXT = readFileSync(new URL("./fixtures/is-this-for-a-blog.txt", import.meta.url), "utf8").replace(/\n$/, "")

const writingNodes = () => {
  const nodes = []
  require("../gatsby-node.js").sourceNodes({
    actions: { createNode: node => nodes.push(node) },
    createNodeId: value => value,
    createContentDigest: () => "digest",
  })
  return nodes.filter(node => node.internal.type === "Writing")
}

test("the Writing section has Is this for a blog or something?, once", () => {
  assert.equal(writingNodes().filter(node => node.title === TITLE).length, 1)
})

test("its text is exactly the original, in one paragraph", () => {
  const story = writingNodes().find(node => node.title === TITLE)
  assert.ok(story, "story missing")
  assert.equal(story.content, TEXT)
  assert.ok(!story.content.includes("\n"), "single paragraph")
  assert.equal(story.content.split(/\s+/).length, 362)
})

test("the Creative carousel announces the real story count, not a spelled-out number", () => {
  const src = readFileSync(new URL("../src/components/scroll/engine/creativeCarousel.ts", import.meta.url), "utf8")
  assert.doesNotMatch(src, /sixteen|seventeen/i)
  assert.match(src, /Stories, \$\{storyCount\} pieces of short fiction/)
})
