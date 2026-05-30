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

test("Throttle appears above Job Toast in the portfolio project list", () => {
  const projects = loadProjects()
  const throttleIndex = projects.findIndex(project => project.name === "Throttle")
  const jobToastIndex = projects.findIndex(project => project.name === "Job Toast")
  const throttle = projects[throttleIndex]

  assert.ok(throttleIndex >= 0)
  assert.ok(jobToastIndex >= 0)
  assert.ok(throttleIndex < jobToastIndex)
  assert.equal(throttle.link, "https://github.com/colorpulse6/throttle/releases/tag/v1.0.0")
  assert.equal(throttle.github, "https://github.com/colorpulse6/throttle")
  assert.equal(throttle.imgSrc, "throttle-dashboard.png")
})

test("El Form uses the current docs URL and dark-mode docs GIF", () => {
  const projects = loadProjects()
  const elForm = projects.find(project => project.name === "El Form")

  assert.ok(elForm)
  assert.equal(elForm.link, "https://elform.dev/docs/intro")
  assert.equal(elForm.github, "https://github.com/colorpulse6/el-form")
  assert.equal(elForm.imgSrc, "elform-docs-dark.gif")
})
