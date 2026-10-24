import test from 'node:test'
import assert from 'node:assert/strict'
import { creativeLayout } from '../src/components/scroll/engine/creativeCarouselMath.ts'

const inside = (r: { x: number; y: number; width: number; height: number }, area: { width: number; height: number }) => r.x >= 0 && r.y >= 0 && r.x + r.width <= area.width && r.y + r.height <= area.height

test('every Creative turn fits both worlds at desktop sizes', () => {
  for (const [width, height] of [[1440, 813], [1366, 768], [1280, 720], [1024, 768]]) {
    const layout = creativeLayout(width, height)
    assert.ok(layout.stories.x + layout.stories.width < layout.music.x)
    for (let turn = 0; turn < 16; turn++) {
      const p = creativeLayout(width, height, turn, turn % 9)
      assert.ok(p.beads.every(r => inside(r, p.stories)), `${width} story ${turn}`)
      assert.ok(p.records.every(r => inside(r, p.music)), `${width} record ${turn}`)
      assert.ok(inside(p.planet, p.stories))
      assert.ok(inside(p.storyCard, p.stories))
      assert.ok(inside(p.recordCard, p.music))
      assert.ok(inside(p.labels.story, p.stories))
      assert.ok(inside(p.labels.record, p.music))
      assert.ok(inside(p.controls.stories, p.stories))
      assert.ok(inside(p.controls.music, p.music))
    }
  }
})

test('phone Creative stage fits its visible world at every turn', () => {
  for (let turn = 0; turn < 16; turn++) {
    const p = creativeLayout(390, 844, turn, turn % 9)
    assert.ok(p.beads.every(r => inside(r, p.stories)))
    assert.ok(p.records.every(r => inside(r, p.music)))
    assert.ok(inside(p.labels.story, p.stories))
    assert.ok(inside(p.labels.record, p.music))
  }
})
