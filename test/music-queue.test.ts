import test from "node:test"
import assert from "node:assert/strict"
import { createQueue, type Track } from "../src/components/music/queue.ts"

const tracks: Track[] = Array.from({ length: 6 }, (_, i) => ({ id: `t${i}`, title: `Track ${i}`, artist: "A", platform: i % 2 ? "spotify" : "soundcloud", ref: `ref${i}` }))
// a small deterministic generator so the shuffle is repeatable
const seeded = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296

test("shuffle plays every track once before any repeats, round after round", () => {
  const queue = createQueue(tracks, { rng: seeded(7), shuffle: true })
  for (let round = 0; round < 3; round++) {
    const seen = new Set<string>()
    for (let i = 0; i < tracks.length; i++) seen.add(round === 0 && i === 0 ? queue.start().id : queue.next().id)
    assert.equal(seen.size, tracks.length, `round ${round}`)
  }
})
test("the same track never plays twice in a row, even across a new round", () => {
  const queue = createQueue(tracks, { rng: seeded(3), shuffle: true })
  let last = queue.start().id
  for (let i = 0; i < 200; i++) { const id = queue.next().id; assert.notEqual(id, last, `step ${i}`); last = id }
})
test("in order, the queue wraps from the last track to the first", () => {
  const queue = createQueue(tracks, { shuffle: false })
  assert.equal(queue.start().id, "t0")
  for (let i = 1; i < 6; i++) assert.equal(queue.next().id, `t${i}`)
  assert.equal(queue.next().id, "t0")
})
test("previous steps back through what played, and next walks forward through it again", () => {
  const queue = createQueue(tracks, { rng: seeded(11), shuffle: true })
  const played = [queue.start().id, queue.next().id, queue.next().id]
  assert.equal(queue.prev().id, played[1])
  assert.equal(queue.prev().id, played[0])
  assert.equal(queue.prev().id, played[0], "stays on the first track at the start of history")
  assert.equal(queue.next().id, played[1])
  assert.equal(queue.next().id, played[2])
})
test("starting on a chosen track plays it first and the rest of the round skips it", () => {
  const queue = createQueue(tracks, { rng: seeded(5), shuffle: true })
  const seen = [queue.start("t4").id]
  for (let i = 1; i < tracks.length; i++) seen.push(queue.next().id)
  assert.equal(seen[0], "t4")
  assert.equal(new Set(seen).size, tracks.length)
})
test("switching shuffle off continues in order from the current track", () => {
  const queue = createQueue(tracks, { rng: seeded(2), shuffle: true })
  queue.start("t2"); queue.setShuffle(false)
  assert.equal(queue.next().id, "t3")
  assert.equal(queue.next().id, "t4")
})

test("adding tracks mid-play keeps what is playing and deals them into the next draws", () => {
  const queue = createQueue(tracks.slice(0, 3), { rng: seeded(9), shuffle: true })
  const first = queue.start()
  queue.setTracks(tracks)
  assert.equal(queue.current?.id, first.id)
  const seen = new Set([first.id])
  for (let i = 0; i < tracks.length - 1; i++) seen.add(queue.next().id)
  assert.equal(seen.size, tracks.length, "every track, old and new, plays once")
})
test("a track pool that no longer holds the current track still moves on", () => {
  const queue = createQueue(tracks, { rng: seeded(4), shuffle: false })
  queue.start("t5")
  queue.setTracks(tracks.slice(0, 2))
  assert.ok(["t0", "t1"].includes(queue.next().id))
})
