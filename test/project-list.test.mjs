import assert from "node:assert/strict"
import { createRequire } from "node:module"
import test from "node:test"

const require = createRequire(import.meta.url)
const { sourceNodes } = require("../gatsby-node.js")

function loadProjects() {
  const nodes = []

  sourceNodes({
    actions: {
      createNode: node => nodes.push(node),
    },
    createNodeId: value => value,
    createContentDigest: value => JSON.stringify(value),
  })

  return nodes.filter(node => node.internal.type === "Project")
}

test("Brain Atlas is the first portfolio project", () => {
  const projects = loadProjects()
  const brainAtlas = projects[0]

  assert.equal(brainAtlas.name, "Brain Atlas")
  assert.equal(brainAtlas.link, "https://community.obsidian.md/plugins/brain-atlas")
  assert.equal(brainAtlas.github, "https://github.com/colorpulse6/brain-atlas")
  assert.equal(brainAtlas.imgSrc, "brain-atlas-spin.gif")
})
