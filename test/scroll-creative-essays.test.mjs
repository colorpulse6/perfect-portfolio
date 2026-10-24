import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SCENES, SCENE_COPY, ESSAYS, RELEASES, COLORPULSE_ALBUMS } from '../src/components/scroll/data/content.ts'

const scene = readFileSync('src/components/scroll/markup/scenes/Scenes.tsx', 'utf8')
const shell = readFileSync('src/components/scroll/ScrollScenes.tsx', 'utf8')
const engine = readFileSync('src/components/scroll/engine/createScrollScenes.ts', 'utf8')
const audio = readFileSync('src/components/audio/AmbientAudioProvider.tsx', 'utf8')
const harness = readFileSync('scripts/scroll-capture.mjs', 'utf8')
const carousel = readFileSync('src/components/scroll/engine/creativeCarousel.ts', 'utf8')
const css = readFileSync('src/components/scroll/scroll.css', 'utf8')
const handoff = readFileSync('src/components/scroll/engine/verticalHandoff.ts', 'utf8')

test('scene order keeps Newsletter at six and gives Creative its own particle headline', () => {
  assert.deepEqual(SCENES.map(s => s.label), ['Intro', 'About', 'Projects', 'Tools and games', 'Essays', 'Creative', 'Newsletter', 'Changelog', 'Work with me', 'Contact', 'Atlas'])
  assert.equal(SCENES[5].id, 'creative')
  assert.ok(SCENE_COPY.creative.headline)
  assert.match(shell, /CreativeScene/)
})

test('ambient audio starts only from a trusted user gesture', () => {
  assert.match(audio, /event\.isTrusted/)
  // active user activation is required where the API exists; browsers without it rely on isTrusted alone
  assert.match(audio, /navigator\.userActivation && !navigator\.userActivation\.isActive/)
})

test('harness checks the split Creative stage and essays handoff', () => {
  assert.match(harness, /creative: both rooms fit/)
  assert.match(harness, /creative: all sixteen full stories and links/)
  assert.match(harness, /creative: reader scrolls in place then hands off/)
  assert.match(harness, /\.story-text, \.project-tech/)
  assert.match(harness, /creative: phone tabs and swipe/)
  assert.match(harness, /essays: scene wheel moves on/)
  assert.doesNotMatch(harness, /creative: two worlds/)
})

test('reduced motion removes Creative animation', () => {
  assert.match(carousel, /creative-reduced/)
  assert.match(css, /prefers-reduced-motion: reduce[^}]*animation: none/)
})

test('phone tabs expose matching tab panels', () => {
  assert.match(carousel, /setAttribute\("role", mobile \? "tabpanel" : "region"\)/)
})

test('Essays show two complete reading cards with direct links and no dive', () => {
  const essays = scene.slice(scene.indexOf('export function EssaysScene'), scene.indexOf('// the letter'))
  assert.match(essays, /data\.essays\.map/)
  assert.match(essays, /item\.excerpt/)
  assert.match(essays, /Read on Medium/)
  assert.match(essays, /noopener/)
  assert.doesNotMatch(essays, /data-set="essays"|PieceCards/)
  assert.doesNotMatch(engine, /essays:\s*\{ name: 'essays'/)
  assert.equal(ESSAYS.length, 2)
})

test('Creative has both worlds, nine factual releases and the approved music links', () => {
  const creative = scene.slice(scene.indexOf('export function CreativeScene'), scene.indexOf('export function EssaysScene'))
  assert.match(creative, /data\.stories/)
  assert.match(creative, /RELEASES\.map/)
  assert.match(creative, /Stories/)
  assert.match(creative, /Alex's Hand/)
  assert.match(creative, /Listen on Bandcamp/)
  assert.match(creative, /className="creative-stage"/)
  assert.match(creative, /className="story-choice"/)
  assert.match(creative, /className="story-text"/)
  assert.match(creative, /formatTextContent\(item\.content\)/)
  assert.doesNotMatch(creative, /story-planet|story-bead/)
  assert.match(creative, /className="story-leaf"/)
  assert.match(creative, /className="record-sleeve"/)
  assert.match(creative, /data-creative-step="-1"/)
  assert.doesNotMatch(creative, /PieceCards/)
  assert.doesNotMatch(engine, /const CON = makeStars|writing:\s*\{ name: 'writing'/)
  assert.doesNotMatch(css, /#creative \.pieces/)
  assert.doesNotMatch(css, /\.cover\.fiction/)
  assert.doesNotMatch(handoff, /stories-world \.pieces/)
  assert.match(handoff, /\.story-text, \.story-index/)
  assert.doesNotMatch(scene.slice(scene.indexOf('function PieceCards'), scene.indexOf('export function HeroScene')), /set === "writing"|EssayItem|StoryItem/)
  assert.equal(RELEASES.length, 9)
  assert.equal(RELEASES.filter(r => r.cover).length, 9)
  assert.equal(COLORPULSE_ALBUMS.length, 3)
  assert.ok(RELEASES.every(r => r.link.startsWith('https://alexshand.bandcamp.com/album/')))
  assert.doesNotMatch(shell, /record-stage|record-orbit|stories-world \.pieces/)
})
