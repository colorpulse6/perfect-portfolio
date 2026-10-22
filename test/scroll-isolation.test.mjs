import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
const read = p => readFileSync(p, 'utf8')
const walk = dir => readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)])
test('scroll route has a dedicated chrome-free layout branch', () => {
  const src = read('src/components/layout.tsx')
  assert.match(src, /isScrollPath\(pagePath\)/)
  const branch = src.match(/if \(isScroll\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(branch, /CosmosStage/)
  for (const name of ['Header','SideBar','SideBarCollapsed','ParticleBackground','TerminalConsole','AudioToggle','TransitionSound','footer','cursor']) assert.doesNotMatch(branch, new RegExp(`<${name}|${name}\\s*\\(`))
})
test('sitemap excludes the experiment', () => assert.match(read('gatsby-config.js'), /excludes:\s*\[\s*['"`]\/scroll\/?['"`]\s*\]/))
test('scroll source never imports docs or prototype', () => {
  for (const file of walk('src')) if (/\.(tsx?|jsx?)$/.test(file)) assert.doesNotMatch(read(file), /(?:from\s*['"][^'"]*|import\s*\(['"][^'"]*)(?:docs\/|prototype\/)/, file)
})
test('scroll CSS selectors are scoped', () => {
  const css = read('src/components/scroll/scroll.css').replace(/\/\*[\s\S]*?\*\//g,'')
  for (const block of css.split('}')) {
    const selector = block.split('{')[0].trim()
    if (!selector || selector.startsWith('@') || selector.includes('from') || selector.includes('to') || selector.includes('%')) continue
    for (const part of selector.split(',')) assert.match(part.trim(), /^(?:html\.ss-on|\.ss)\b/, part)
  }
})
test('ScrollScenes is memoized and reserves a cancelled effect for the dynamic engine', () => {
  const src = read('src/components/scroll/ScrollScenes.tsx')
  assert.match(src, /React\.memo\(/)
  assert.match(src, /useEffect/)
  assert.match(src, /cancelled/)
  assert.doesNotMatch(src, /import\s+.*engine\//)
})
test('legend renders the same data as the scene list', () => {
  const hud = read('src/components/scroll/markup/Hud.tsx')
  const root = read('src/components/scroll/ScrollScenes.tsx')
  assert.match(hud, /scenes\.map\(/)
  assert.match(root, /data\.scenes\.map\(/)
  assert.match(root, /<Hud scenes=\{data\.scenes\}/)
})
test('engine boots only inside the cancellable effect', () => {
  const src = read('src/components/scroll/ScrollScenes.tsx')
  assert.match(src, /useEffect\([\s\S]*import\(["']\.\/engine\/createScrollScenes["']\)/)
  assert.match(src, /if \(cancelled\) return/)
  assert.match(src, /dispose\?\.\(\)/)
})
test('engine import is inert and listeners use the disposable input helper', () => {
  const files = walk('src/components/scroll/engine').filter(file => /\.ts$/.test(file))
  assert.ok(files.length)
  for (const file of files) {
    const src = read(file)
    const importScope = file.endsWith('createScrollScenes.ts') ? src.split('export function createScrollScenes')[0] : src
    assert.doesNotMatch(importScope, /^(?:const|let|var)\s+\w+\s*=\s*(?:window|document)\b/m, file)
    if (!file.endsWith('input.ts')) assert.doesNotMatch(src, /\.addEventListener\(/, file)
  }
  const engine = read('src/components/scroll/engine/createScrollScenes.ts')
  assert.match(engine, /html\.classList\.remove\(['"]ss-on['"],\s*['"]locked['"](?:,|\))/)
  assert.match(engine, /loseContext\(\)/)
  assert.match(engine, /delete window\.__ss/)
})
test('a failed engine boot leaves no ss-on class behind', () => {
  const src = read('src/components/scroll/ScrollScenes.tsx')
  assert.match(src, /catch[\s\S]*classList\.remove\(["']ss-on["']\)/)
})
test('the story reveal wait is cancelled when the reveal is stopped', () => {
  const src = read('src/pages/writing.tsx')
  assert.match(src, /cancelAnimationFrame\(revealFrame\.current\)/)
})
