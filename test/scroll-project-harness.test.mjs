import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('browser harness checks the Projects carousel and keeps dive checks on other scenes', () => {
  const harness = readFileSync('scripts/scroll-capture.mjs', 'utf8')
  for (const name of ['moons reachable', 'wheel and keys turn', 'wraps both ways', 'panel equals data', 'video active only', 'no panel ghost', 'phone fit', 'projects: no dive']) assert.ok(harness.includes(name), name)
  assert.doesNotMatch(harness, /#projects \.ring li|__ss\.detailTech\('projects'/)
  assert.match(harness, /\['tools', 1440, 900/)
})
