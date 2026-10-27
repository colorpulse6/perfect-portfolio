import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const NEW = 'https://projectchimera.dev/'

test('nothing tracked links the old Chimera address', () => {
  let hits = ''
  try { hits = execFileSync('git', ['grep', '-n', '-i', 'colorpulse6.github.io/project-chimera', '--', '.', ':!test/chimera-domain.test.mjs'], { encoding: 'utf8' }) } catch (error) { if (error.status !== 1) throw error }
  assert.equal(hits, '')
})
test('every Chimera changelog entry links the new domain', () => {
  const files = readdirSync('content/changelog').filter(name => name.startsWith('chimera-'))
  assert.ok(files.length >= 2)
  for (const name of files) assert.match(readFileSync(`content/changelog/${name}`, 'utf8'), new RegExp(`^link: "${NEW}"$`, 'm'), name)
})
test('the scroll data links the new domain for Chimera', () => {
  assert.match(readFileSync('src/components/scroll/data/content.ts', 'utf8'), new RegExp(`name: "Chimera"[\\s\\S]*?link: "${NEW}"`))
})
