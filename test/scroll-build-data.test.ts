import test from "node:test"
import assert from "node:assert/strict"
import { buildScrollData } from "../src/components/scroll/data/buildScrollData.ts"
import { TECH_ICON, PRODUCTS, TOOLS } from "../src/components/scroll/data/content.ts"
import { createRequire } from "node:module"

test("query nodes become ordered scroll data with a curated Chimera override", () => {
  const result = buildScrollData({
    allProject: { nodes: [...PRODUCTS.slice(1), ...TOOLS].map(name => ({ name, slug: name.toLowerCase(), medium: "APP", status: "released", link: "https://example.com", github: null, tech: ["Swift"], description: "Native workspace." })) },
    allWriting: { nodes: [{ title: "Jerks" }] },
    changelog: { nodes: [] },
    newsletter: { nodes: [{ fields: { slug: "2026-W42" }, frontmatter: { title: "Issue", date: "2026-10-16", issue: 14, deck: "A note." }, rawMarkdownBody: "Hello.\n\n![A picture](./img/x.jpg)" }] },
    allFile: { nodes: [{ relativePath: "2026-W42/img/x.jpg", childImageSharp: { resize: { src: "/static/x.jpg", width: 720, height: 450 } } }] },
  })
  assert.deepEqual(result.projects.map(item => item.name), PRODUCTS)
  assert.equal(result.projects[0].open, "Where the game stands")
  assert.equal(result.stories[0].link, "/writing/#jerks")
  assert.equal(result.bio[1].includes("Cerebro Mycelium"), false)
  assert.equal(result.letters[0].blocks[1].kind, "image")
  // the source path stays with the picture, so a check can name the file behind a hashed src
  assert.deepEqual(result.letters[0].blocks[1], { kind: "image", alt: "A picture", src: "/static/x.jpg", file: "2026-W42/img/x.jpg" })
})

test("selected apps and all sixteen stories resolve from Gatsby nodes", () => {
  const require = createRequire(import.meta.url)
  const nodes: Array<{ internal: { type: string }; name?: string; status?: string; tech?: string[]; title?: string }> = []
  require("../gatsby-node.js").sourceNodes({
    actions: { createNode: (node: typeof nodes[number]) => nodes.push(node) },
    createNodeId: (value: string) => value,
    createContentDigest: () => "digest",
  })
  const projects = nodes.filter(node => node.internal.type === "Project")
  const stories = nodes.filter(node => node.internal.type === "Writing")
  assert.equal(stories.length, 16)
  for (const name of [...PRODUCTS.slice(1), ...TOOLS]) {
    const project = projects.find(node => node.name === name)
    assert.ok(project && project.status !== "disabled", `Missing active project: ${name}`)
    for (const technology of project.tech ?? []) assert.ok(TECH_ICON[technology], `${name}: ${technology}`)
  }
})
