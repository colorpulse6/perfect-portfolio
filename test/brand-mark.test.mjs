import assert from "node:assert/strict"
import crypto from "node:crypto"
import fs from "node:fs"
import test from "node:test"
import sharp from "sharp"

const SELECTED_MARK_SHA256 = "3f6fb6250063d29ed64b9e9f200fce28e06121232d406af065ad2041ef97af83"

function sha256(path) {
  return crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex")
}

test("the selected Atlas Constellation mark is the canonical site identity", () => {
  assert.equal(sha256("src/images/nic-barnes-logo.png"), SELECTED_MARK_SHA256)
  assert.equal(sha256("static/og-image.png"), SELECTED_MARK_SHA256)

  const config = fs.readFileSync("gatsby-config.js", "utf8")
  const structuredData = fs.readFileSync("src/helpers/structuredData.ts", "utf8")

  assert.match(config, /icon:\s*`src\/images\/nic-barnes-logo\.png`/)
  assert.match(structuredData, /image:\s*`\$\{SITE_URL\}\/og-image\.png`/)
})

test("the header exposes the brand mark as the home link", () => {
  const header = fs.readFileSync("src/components/header.tsx", "utf8")
  const styles = fs.readFileSync("src/components/header.css", "utf8")

  assert.match(header, /import BrandMark from "\.\.\/images\/nic-barnes-logo\.png"/)
  assert.match(header, /<Link[\s\S]*aria-label="Home"[\s\S]*<img[\s\S]*className="brand-mark"[\s\S]*src=\{BrandMark\}/)
  assert.match(styles, /\.brand-mark\s*{[\s\S]*object-fit:\s*cover/)
})

test("the large social card carries the selected mark's cyan accent", async () => {
  const card = sharp("static/og-card.png")
  const metadata = await card.metadata()
  assert.equal(metadata.width, 1200)
  assert.equal(metadata.height, 630)

  const { data, info } = await card.removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let cyanPixels = 0

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset]
    const green = data[offset + 1]
    const blue = data[offset + 2]
    if (green > 170 && blue > 160 && green - red > 70 && blue - red > 60) {
      cyanPixels += 1
    }
  }

  assert.ok(cyanPixels > 10, `expected cyan brand pixels, found ${cyanPixels}`)
})
