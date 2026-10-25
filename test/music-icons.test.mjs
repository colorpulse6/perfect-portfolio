import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = p => readFileSync(p, 'utf8')

test('one component draws the SoundCloud, Spotify and Bandcamp marks', () => {
  const src = read('src/components/music/PlatformIcon.tsx')
  for (const name of ['SiSoundcloud', 'SiSpotify', 'SiBandcamp']) assert.match(src, new RegExp(name))
})
test('every music link and the player bar carry their platform mark', () => {
  const scenes = read('src/components/scroll/markup/scenes/Scenes.tsx')
  assert.equal((scenes.match(/<PlatformIcon platform="bandcamp"/g) || []).length, 2, 'Bandcamp: the album link and the Priaprizm card')
  assert.equal((scenes.match(/<PlatformIcon platform="spotify"/g) || []).length, 1)
  assert.equal((scenes.match(/<PlatformIcon platform="soundcloud"/g) || []).length, 2, 'SoundCloud: the album link and the profile pill')
  const bar = read('src/components/music/MusicBar.tsx')
  assert.match(bar, /<PlatformIcon platform=\{track\.platform\}/)
  assert.match(bar, /<PlatformIcon platform="spotify"/)
})
test('the scroll stylesheet colours the marks, since it reverts inline colour on svg elements', () => {
  const css = read('src/components/scroll/scroll.css')
  for (const platform of ['soundcloud', 'spotify', 'bandcamp']) assert.match(css, new RegExp(`\\.platform-icon\\[data-platform="${platform}"\\]\\s*\\{\\s*color:`))
})
test('the scroll stylesheet fills the marks with their colour, since its revert resets fill to black', () => {
  assert.match(read('src/components/scroll/scroll.css'), /\.ss #creative \.platform-icon \{[^}]*fill: currentColor/)
})
