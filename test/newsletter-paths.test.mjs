import assert from "node:assert/strict"
import { createRequire } from "node:module"
import test from "node:test"

const require = createRequire(import.meta.url)
const { onCreateNode } = require("../gatsby-node.js")

// Netlify stores deployed paths in lowercase and 301s mixed-case requests,
// so /newsletter/2026-W42/ redirects to /newsletter/2026-w42/. The slug drives
// the page path, so it must already be lowercase or the sitemap, canonical and
// internal links all point at a redirect.
function newsletterSlug(relativeDirectory) {
  const fields = {}
  const parent = { sourceInstanceName: "newsletter", relativeDirectory }
  onCreateNode({
    node: { internal: { type: "MarkdownRemark" }, parent: "file" },
    getNode: () => parent,
    actions: {
      createNodeField: ({ name, value }) => {
        fields[name] = value
      },
    },
  })
  return fields.slug
}

test("newsletter slugs are lowercase so page paths match Netlify's served URLs", () => {
  assert.equal(newsletterSlug("2026-W42"), "2026-w42")
  assert.equal(newsletterSlug("2026-W29"), "2026-w29")
})
