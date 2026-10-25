import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = p => readFileSync(p, 'utf8')

test('the header carries no menu button or link to the old pages', () => {
  const src = read('src/components/header.tsx')
  assert.doesNotMatch(src, /Hamburger/)
  assert.doesNotMatch(src, /work-with-me/)
})
test('the Atlas layout mounts no sidebar menu', () => {
  const src = read('src/components/layout.tsx')
  assert.doesNotMatch(src, /<SideBar\b/)
  assert.doesNotMatch(src, /import SideBar\b/)
})
test('the site config lists no old-page menu links', () => {
  assert.doesNotMatch(read('gatsby-config.js'), /menuLinks/)
})
test('the home surface links to no old page', () => {
  assert.doesNotMatch(read('src/components/scroll/data/changelogItems.ts'), /\/changelog\//)
  const build = read('src/components/scroll/data/buildScrollData.ts')
  assert.doesNotMatch(build, /link: `\/writing\//)
  assert.doesNotMatch(build, /link: `\/newsletter\//)
})
