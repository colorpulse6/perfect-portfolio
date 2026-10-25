import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = p => readFileSync(p, 'utf8')

test('the control bar is mounted by the layout on both the home scroll and the Atlas branches', () => {
  const src = read('src/components/layout.tsx')
  assert.equal((src.match(/<MusicBar \/>/g) || []).length, 2)
})
test('the Atlas link navigates inside the app so the player keeps playing', () => {
  const scenes = read('src/components/scroll/markup/scenes/Scenes.tsx')
  assert.match(scenes, /className="pill atlas"[^>]*onClick=/)
  assert.match(scenes, /navigate\(SCENE_COPY\.atlas\.link\)/)
})
test('Creative offers one Shuffle play button that starts the player', () => {
  const scenes = read('src/components/scroll/markup/scenes/Scenes.tsx')
  assert.match(scenes, /className="music-play-all"/)
  assert.match(scenes, /startMusic\(\{ shuffle: true \}\)/)
})
test('Spotify joins the queue only after the listener presses play inside its embed', () => {
  const player = read('src/components/music/player.ts')
  assert.match(player, /onStarted/)
  assert.match(player, /queue = createQueue\(SOUNDCLOUD_TRACKS/)
  assert.match(player, /queue\.setTracks\(TRACKS\)/)
})
