import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

test("floating changelog cards support custom media and CTA labels", () => {
  const source = fs.readFileSync(
    path.join(rootDir, "src", "components", "nebula", "DomArtifacts.tsx"),
    "utf8"
  )

  assert.match(source, /media: string \| null/)
  assert.match(source, /cta: string \| null/)
  assert.match(source, /brain-atlas-spin\.gif/)
  assert.match(source, /cerebro-mycelium\.gif/)
  assert.match(source, /entry\.cta \|\|/)
})
