import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function readSource(...parts) {
  return fs.readFileSync(path.join(rootDir, ...parts), "utf8")
}

test("entered atlas clusters keep project orbits clear of the center and each other", () => {
  const canvas = readSource("src", "components", "atlas", "AtlasCanvas.tsx")

  assert.match(canvas, /const ENTERED_ORBIT_BASE = 42/)
  assert.match(canvas, /const ENTERED_ORBIT_GAP = 22/)
  assert.match(canvas, /const ENTERED_ORBIT_JITTER = 6/)
  assert.match(canvas, /const ORBIT_ANGLE_STEP = Math\.PI \* \(3 - Math\.sqrt\(5\)\)/)
  assert.match(
    canvas,
    /const orbitR = h\.shells\s*\?\s*SHELLED_ORBIT_BASE \+ idxInShell \* SHELLED_ORBIT_GAP \+ rnd\(\) \* SHELLED_ORBIT_JITTER\s*:\s*ENTERED_ORBIT_BASE \+ i \* ENTERED_ORBIT_GAP \+ rnd\(\) \* ENTERED_ORBIT_JITTER/s,
  )
  assert.match(canvas, /ang: \(h\.shells \? idxInShell : i\) \* ORBIT_ANGLE_STEP \+ rnd\(\) \* 0\.35/)
})

test("entered atlas project labels participate in hover and click hit testing", () => {
  const canvas = readSource("src", "components", "atlas", "AtlasCanvas.tsx")
  const types = readSource("src", "components", "atlas", "sceneTypes.ts")

  assert.match(types, /label\?: \{\s*x: number\s*y: number\s*w: number\s*h: number\s*\}/s)
  assert.match(canvas, /const labelX = pr\.sx \+ rad \* 1\.5 \+ 6/)
  assert.match(canvas, /const labelW = ctx\.measureText\(pl\.work\.t\)\.width/)
  assert.match(canvas, /label: labelBox/)
  assert.match(canvas, /const inLabel =\s*!!ph\.label[\s\S]*mx <= ph\.label\.x \+ ph\.label\.w[\s\S]*my <= ph\.label\.y \+ ph\.label\.h/)
  assert.match(canvas, /const rank = inBody \? d : inLabel \? d \+ 0\.01 : 999/)
})
