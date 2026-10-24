import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("about FAQ moves unchanged and still feeds visible and structured answers", () => {
  const about = readFileSync(new URL("../src/pages/about.tsx", import.meta.url), "utf8")
  const faq = readFileSync(new URL("../src/helpers/aboutFaq.ts", import.meta.url), "utf8")
  assert.match(about, /import \{ ABOUT_FAQ \} from "\.\.\/helpers\/aboutFaq"/)
  assert.match(about, /faqPage\(ABOUT_FAQ\)/)
  assert.match(faq, /Who is Nichalas Barnes\?/)
  assert.match(faq, /What technologies does Nichalas Barnes work with\?/)
})
