import test from "node:test"
import assert from "node:assert/strict"
import { letterBlocks } from "../src/components/scroll/data/letterBlocks.ts"
import { readdirSync, readFileSync } from "node:fs"

test("letter blocks preserve the supported structure and inline parts", () => {
  assert.deepEqual(letterBlocks("## Hello\n\nRead [there](https://example.com) and `code`.\n\n![A view](./img/a.jpg)"), [
    { kind: "heading", text: "Hello" },
    { kind: "paragraph", parts: [
      { kind: "text", text: "Read " }, { kind: "link", text: "there", href: "https://example.com" },
      { kind: "text", text: " and " }, { kind: "code", text: "code" }, { kind: "text", text: "." },
    ] },
    { kind: "image", alt: "A view", src: "./img/a.jpg" },
  ])
  for (const raw of ["- list", "> quote", "**bold**", "```js\nx\n```", "<div>x</div>"]) {
    assert.throws(() => letterBlocks(raw))
  }
})

test("all fourteen site letters use the supported grammar", () => {
  const root = new URL("../content/newsletter/", import.meta.url)
  const weeks = readdirSync(root).filter(name => /^\d{4}-W\d{2}$/.test(name)).sort().reverse()
  assert.equal(weeks.length, 14)
  const counts = weeks.map(week => {
    const raw = readFileSync(new URL(`${week}/index.md`, root), "utf8")
    return letterBlocks(raw.split(/^---\s*$/m).slice(2).join("---")).length
  })
  assert.deepEqual(counts, [27, 24, 26, 28, 27, 25, 39, 26, 25, 25, 27, 30, 29, 23])
})
