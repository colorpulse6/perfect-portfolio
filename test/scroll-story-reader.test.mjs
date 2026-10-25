import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
const read = p => readFileSync(p, 'utf8')

test('every story offers a full screen reader', () => {
  const scenes = read('src/components/scroll/markup/scenes/Scenes.tsx')
  assert.match(scenes, /data-story-expand/)
  const dialog = read('src/components/scroll/markup/StoryReaderDialog.tsx')
  for (const id of ['story-reader', 'story-reader-title', 'story-reader-text', 'story-reader-prev', 'story-reader-next', 'story-reader-close']) assert.match(dialog, new RegExp(`id="${id}"`))
  assert.match(dialog, /role="dialog"/)
  assert.match(dialog, /aria-modal="true"/)
  assert.match(read('src/components/scroll/ScrollScenes.tsx'), /<StoryReaderDialog \/>/)
})
test('the reader owns the keys, wheel and focus while open', () => {
  const src = read('src/components/scroll/engine/storyReader.ts')
  assert.match(src, /Escape/)
  assert.match(src, /stopPropagation/)
  assert.match(src, /focus\(/)
  assert.match(read('src/components/scroll/engine/createScrollScenes.ts'), /createStoryReader\(/)
})
test('Priaprizm and Colorpulse show their own photographs', () => {
  for (const file of ['priaprizm.jpg', 'colorpulse.jpg']) assert.ok(existsSync(`src/components/scroll/images/${file}`), file)
  const scenes = read('src/components/scroll/markup/scenes/Scenes.tsx')
  assert.match(scenes, /images\/priaprizm\.jpg/)
  assert.match(scenes, /images\/colorpulse\.jpg/)
})
