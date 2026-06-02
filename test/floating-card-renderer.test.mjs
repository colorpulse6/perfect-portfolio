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
  const cardSource = fs.readFileSync(
    path.join(rootDir, "src", "components", "nebula", "cardRendering.ts"),
    "utf8"
  )

  assert.match(source, /media: string \| null/)
  assert.match(source, /cta: string \| null/)
  assert.match(cardSource, /brain-atlas-spin\.mp4/)
  assert.match(cardSource, /cerebro-mycelium\.mp4/)
  assert.match(cardSource, /throttle-dashboard\.png/)
  assert.match(cardSource, /cerebro-dashboard\.png/)
  assert.match(source, /entry\.cta \|\|/)
  assert.match(cardSource, /isContainMedia/)
  assert.match(cardSource, /const contained = isContainMedia\(media\)/)
  assert.match(cardSource, /objectFit:\s*contained\s*\?\s*"contain"\s*:\s*"cover"/)
})

test("Cerebro floating card media preserves the full screenshot", () => {
  const source = fs.readFileSync(
    path.join(rootDir, "src", "components", "nebula", "DomArtifacts.tsx"),
    "utf8"
  )
  const cardSource = fs.readFileSync(
    path.join(rootDir, "src", "components", "nebula", "cardRendering.ts"),
    "utf8"
  )

  assert.match(cardSource, /CONTAIN_MEDIA[\s\S]*cerebro-dashboard\.png/)
  assert.match(cardSource, /height:\s*getCardMediaHeight\(media\)/)
  assert.match(cardSource, /objectFit:\s*contained\s*\?\s*"contain"\s*:\s*"cover"/)
})
