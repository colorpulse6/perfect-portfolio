import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"

test("scroll sources stay local and keep copy and asset counts", () => {
  const root = new URL("../src/components/scroll/", import.meta.url)
  const files = readdirSync(new URL("data/", root)).filter(name => name.endsWith(".ts"))
  const source = files.map(name => readFileSync(new URL(`data/${name}`, root), "utf8")).join("\n")
  assert.doesNotMatch(source, /from\s+["'][^"']*docs\//)
  assert.doesNotMatch(source, /[\u2014\u2013]/)
  const content = readFileSync(new URL("data/content.ts", root), "utf8")
  assert.doesNotMatch(content, /Open the full issue|All articles|Buy me a coffee/)
  assert.match(content, /Where the game stands/)
  assert.match(content, /project-chimera/)
  assert.equal(readdirSync(new URL("images/", root)).filter(name => name.endsWith(".jpg")).length, 20)
  assert.equal(readdirSync(new URL("tech/", root)).filter(name => name.endsWith(".svg")).length, 21)
})

test("curated social destinations match the site header", () => {
  const header = readFileSync(new URL("../src/components/header.tsx", import.meta.url), "utf8")
  const content = readFileSync(new URL("../src/components/scroll/data/content.ts", import.meta.url), "utf8")
  const urls = [...header.matchAll(/href="(https:\/\/[^\"]+)"/g)].map(match => match[1])
  const curated = [...content.matchAll(/href: "(https:\/\/[^\"]+)"/g)].map(match => match[1])
  assert.deepEqual(curated, urls.slice(0, 5))
})
