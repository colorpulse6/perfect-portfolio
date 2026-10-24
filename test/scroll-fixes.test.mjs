import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"

const base = new URL("../src/components/scroll/", import.meta.url)
const css = readFileSync(new URL("scroll.css", base), "utf8")
const scenes = readFileSync(new URL("markup/scenes/Scenes.tsx", base), "utf8")
const engine = readFileSync(new URL("engine/createScrollScenes.ts", base), "utf8")
const data = readFileSync(new URL("data/content.ts", base), "utf8")
const read = path => readFileSync(new URL(path, base), "utf8")

test("scroll body tone reaches AA over the brightest allowed nebula", () => {
  const match = css.match(/--mute:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
  assert.ok(match)
  const [, r, g, b, a] = match.map(Number)
  const srgb = c => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const lum = rgb => rgb.reduce((sum, c, i) => sum + srgb(c) * [0.2126, 0.7152, 0.0722][i], 0)
  const fg = [r, g, b].map(v => v * a + 34 * (1 - a))
  assert.ok((lum(fg) + 0.05) / (lum([34, 34, 54]) + 0.05) >= 4.5)
  assert.match(css, /\.ss \.bio[^\n]*background: rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\.[5-9]/)
})

test("nebula uses a sharper WebGL buffer and dither before quantization", () => {
  assert.doesNotMatch(engine, /S\.tier === 'high' \? 4 : 6/)
  assert.match(engine, /hash12\(gl_FragCoord\.xy[^\n]*\/ 255\./)
})

test("Cerebro is the Orb screenshot, within the route image budget", () => {
  const image = readFileSync(new URL("images/cerebro.jpg", base))
  assert.ok(image.length > 200000)
  const images = readdirSync(new URL("images/", base)).filter(x => x.endsWith(".jpg"))
  const bytes = images.reduce((sum, name) => sum + statSync(new URL(`images/${name}`, base)).size, 0)
  assert.ok(bytes <= 2 * 1024 * 1024, `${bytes} image bytes`)
  assert.doesNotMatch(read("data/useScrollData.ts"), /cerebro-mycelium\.mp4/)
})

test("contact scene uses the existing Netlify hook without a visible address", () => {
  assert.match(scenes, /useNetlifyForm/)
  assert.match(scenes, /name="form-name" value="contact"/)
  for (const name of ["name", "email", "message"]) assert.match(scenes, new RegExp(`name="${name}"`))
  assert.doesNotMatch(scenes, /data-netlify|mailto:/)
  assert.doesNotMatch(data, /colorpulse@gmail\.com/)
  assert.match(scenes, /aria-live="polite"/)
  assert.match(engine, /el\.inert = P\.o < 0\.5/)
  assert.match(read("engine/projectCarousel.ts"), /isContentEditable/)
  assert.match(engine, /e\.target as HTMLElement\)\?\.closest\?\.\('input, textarea, select, \[contenteditable\]'/)
})
