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
  assert.match(source, /brain-atlas-spin\.mp4/)
  assert.match(source, /cerebro-mycelium\.mp4/)
  assert.match(source, /throttle-dashboard\.png/)
  assert.match(source, /cerebro-dashboard\.png/)
  assert.match(source, /entry\.cta \|\|/)
  assert.match(source, /isContainMedia/)
  assert.match(source, /const contained = isContainMedia\(media\)/)
  assert.match(source, /objectFit:\s*contained\s*\?\s*"contain"\s*:\s*"cover"/)
})

test("Cerebro floating card media preserves the full screenshot", () => {
  const source = fs.readFileSync(
    path.join(rootDir, "src", "components", "nebula", "DomArtifacts.tsx"),
    "utf8"
  )

  assert.match(source, /CONTAIN_MEDIA[\s\S]*cerebro-dashboard\.png/)
  assert.match(source, /height:\s*getCardMediaHeight\(media\)/)
  assert.match(source, /objectFit:\s*contained\s*\?\s*"contain"\s*:\s*"cover"/)
})
