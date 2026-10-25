import test from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"

test("scroll asset set and generated sprite match the approved counts", () => {
  const base = new URL("../src/components/scroll/", import.meta.url)
  const images = readdirSync(new URL("images/", base)).filter(name => name.endsWith(".jpg"))
  const tech = readdirSync(new URL("tech/", base)).filter(name => name.endsWith(".svg"))
  assert.equal(images.length, 25)
  assert.equal(tech.length, 21)
  const sprite = readFileSync(new URL("techSprite.generated.ts", base), "utf8")
  assert.equal((sprite.match(/<symbol /g) || []).length, 21)
  assert.ok(readFileSync(new URL("fonts/montserrat-var.woff2", base)).length > 10000)
  assert.ok(readFileSync(new URL("fonts/OFL.txt", base), "utf8").includes("SIL OPEN FONT LICENSE"))
  execFileSync("node", ["scripts/scroll-sprite.mjs", "--check"])
})
