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

test("Polis Atlas is the first portfolio project", () => {
  const projects = loadProjects()
  const polisAtlas = projects[0]

  assert.equal(polisAtlas.name, "Polis Atlas")
  assert.equal(polisAtlas.link, "https://polisatlas.com/")
  assert.equal(polisAtlas.imgSrc, "polis-atlas.jpg")
})

test("Brain Atlas remains in the portfolio with its plugin + repo links", () => {
  const projects = loadProjects()
  const brainAtlas = projects.find(project => project.name === "Brain Atlas")

  assert.ok(brainAtlas)
  assert.equal(brainAtlas.link, "https://community.obsidian.md/plugins/brain-atlas")
  assert.equal(brainAtlas.github, "https://github.com/colorpulse6/brain-atlas")
  assert.equal(brainAtlas.imgSrc, "brain-atlas-spin.mp4")
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

test("El Form uses the current docs URL and dark-mode docs clip", () => {
  const projects = loadProjects()
  const elForm = projects.find(project => project.name === "El Form")

  assert.ok(elForm)
  assert.equal(elForm.link, "https://elform.dev/docs/intro")
  assert.equal(elForm.github, "https://github.com/colorpulse6/el-form")
  assert.equal(elForm.imgSrc, "elform-docs-dark.mp4")
})

test("Cerebro appears in the portfolio as a work-in-progress macOS app", () => {
  const projects = loadProjects()
  const cerebroIndex = projects.findIndex(project => project.name === "Cerebro")
  const jobToastIndex = projects.findIndex(project => project.name === "Job Toast")
  const cerebro = projects[cerebroIndex]

  assert.ok(cerebroIndex >= 0)
  assert.ok(jobToastIndex >= 0)
  assert.ok(cerebroIndex < jobToastIndex)
  assert.equal(cerebro.link, "https://github.com/colorpulse6/cerebro-orchestra")
  assert.equal(cerebro.github, "https://github.com/colorpulse6/cerebro-orchestra")
  assert.equal(cerebro.imgSrc, "cerebro-dashboard.png")
  assert.match(cerebro.description, /work-in-progress native macOS/i)
})
