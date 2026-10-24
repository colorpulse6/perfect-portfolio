import test from "node:test"
import assert from "node:assert/strict"
import { changelogItems } from "../src/components/scroll/data/changelogItems.ts"
import { readdirSync, readFileSync } from "node:fs"

test("changelog chooses six latest records with stable ties and first paragraph", () => {
  const items = changelogItems([
    { name: "b", frontmatter: { title: "B", date: "2026-07-26", type: "update", project: "Web" }, rawMarkdownBody: "First.\n\nSecond." },
    { name: "a", frontmatter: { title: "A", date: "2026-07-26", type: "update", project: "Web" }, rawMarkdownBody: "Opening." },
  ])
  assert.deepEqual(items.map(item => item.title), ["A", "B"])
  assert.equal(items[0].excerpt, "Opening.")
  assert.equal(items[0].meta, "Update · Web · 26 July 2026")
})

test("site changelog supplies the six approved latest entries", () => {
  const root = new URL("../content/changelog/", import.meta.url)
  const nodes = readdirSync(root).filter(name => name.endsWith(".md")).map(name => {
    const raw = readFileSync(new URL(name, root), "utf8")
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw)
    assert.ok(match, name)
    const fields = Object.fromEntries(match[1].split("\n").map(line => {
      const at = line.indexOf(":")
      return [line.slice(0, at), line.slice(at + 1).trim().replace(/^"|"$/g, "")]
    }))
    return { name: name.slice(0, -3), frontmatter: {
      title: fields.title, date: fields.date, type: fields.type, project: fields.project ?? null,
    }, rawMarkdownBody: match[2] }
  })
  const items = changelogItems(nodes)
  assert.deepEqual(items.map(item => item.title), [
    "The Atlas: A Galaxy Around a Black Hole", "Cerebro: Public Beta for macOS",
    "Sector Zero: A Cinematic Opening", "Job Toast: Interview Prep",
    "Brain Atlas 0.2: A WebGL2 Renderer", "Regexplain: A Terminal Workbench",
  ])
  assert.equal(items[0].meta, "Update · Web · 27 September 2026")
})
