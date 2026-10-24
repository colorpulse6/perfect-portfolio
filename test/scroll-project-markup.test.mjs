import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('Projects has seven moon buttons, a labelled panel and no project dive cards', () => {
  const scene = readFileSync('src/components/scroll/markup/scenes/Scenes.tsx', 'utf8')
  const projects = scene.slice(scene.indexOf('export function ProjectsScene'), scene.indexOf('export function ToolsScene'))
  assert.match(projects, /className="project-moon"/)
  assert.match(projects, /className="project-panel"/)
  assert.doesNotMatch(projects, /aria-live="polite"/)
  assert.doesNotMatch(projects, /AppCards|data-set="projects"/)
})

test('Projects exposes every panel article without JavaScript', () => {
  const shell = readFileSync('src/components/scroll/ScrollScenes.tsx', 'utf8')
  assert.match(shell, /\.ss #projects \.project-leaf\[hidden\] \{ display: block; \}/)
})

test('short project card copy is removed with the old cards', () => {
  const content = readFileSync('src/components/scroll/data/content.ts', 'utf8')
  const cardLines = content.slice(content.indexOf('export const CARD_LINE'), content.indexOf('export const PRODUCTS'))
  assert.doesNotMatch(cardLines, /Chimera:|Cerebro:|"Brain Atlas":|GalAtlas:|"Polis Atlas":|"Job Toast":|"El Form":/)
})

test('panel swaps crossfade and retire the previous project', () => {
  const engine = readFileSync('src/components/scroll/engine/projectCarousel.ts', 'utf8')
  assert.match(engine, /classList\.add\("outgoing"\)/)
  assert.match(engine, /leaf\.hidden = true/)
})

test('Projects and Newsletter share the root live region', () => {
  const shell = readFileSync('src/components/scroll/ScrollScenes.tsx', 'utf8')
  const scene = readFileSync('src/components/scroll/markup/scenes/Scenes.tsx', 'utf8')
  assert.match(shell, /id="orbit-announce" aria-live="polite"/)
  assert.doesNotMatch(scene, /id="project-announce"|id="orbit-announce"/)
})

test('keyboard rotation keeps visible focus on the active moon', () => {
  const engine = readFileSync('src/components/scroll/engine/projectCarousel.ts', 'utf8')
  assert.match(engine, /moons\[current\]\.focus\(\{ preventScroll: true \}\)/)
})
