import test from "node:test"
import assert from "node:assert/strict"
import { createHandoff, HOLD_MS } from "../src/components/scroll/engine/verticalHandoff.ts"

test("a wheel over something that cannot scroll is never held", () => {
  const handoff = createHandoff()
  // a trackpad sends an event about every 16 ms; two seconds of them
  for (let t = 0; t < 2000; t += 16) assert.equal(handoff.holds({ room: false, scrollable: false, now: t }), false, `t=${t}`)
})
test("a wheel at the top or bottom of a text is not held when the text did not just scroll", () => {
  const handoff = createHandoff()
  assert.equal(handoff.holds({ room: false, scrollable: true, now: 5000 }), false)
})
test("momentum right after the text runs out is held, then the page takes the wheel", () => {
  const handoff = createHandoff()
  assert.equal(handoff.holds({ room: true, scrollable: true, now: 1000 }), false)
  assert.equal(handoff.holds({ room: false, scrollable: true, now: 1016 }), true)
  assert.equal(handoff.holds({ room: false, scrollable: true, now: 1000 + HOLD_MS - 1 }), true)
  // a continuous wheel does not extend the hold
  for (let t = 1000 + HOLD_MS; t < 4000; t += 16) assert.equal(handoff.holds({ room: false, scrollable: true, now: t }), false, `t=${t}`)
})
