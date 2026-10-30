import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { buildScrollData } from '../src/components/scroll/data/buildScrollData.ts'
import { PRODUCTS, TOOLS, RELEASES, COLORPULSE_ALBUMS } from '../src/components/scroll/data/content.ts'
import { creativeWrap, creativeRoomLayout } from '../src/components/scroll/engine/creativeCarouselMath.ts'

test('all seventeen source stories retain their complete text and order', () => {
  const nodes: Array<{ internal: { type: string }; title?: string; content?: string }> = []
  createRequire(import.meta.url)('../gatsby-node.js').sourceNodes({
    actions: { createNode: (node: typeof nodes[number]) => nodes.push(node) },
    createNodeId: (value: string) => value,
    createContentDigest: () => 'digest',
  })
  const writing = nodes.filter((node): node is typeof node & { title: string; content: string } => node.internal.type === 'Writing' && !!node.title && !!node.content)
  const projects = [...PRODUCTS.slice(1), ...TOOLS].map(name => ({ name, slug: name, medium: 'APP', status: 'released', link: '', github: null, tech: [], description: '' }))
  const result = buildScrollData({ allProject: { nodes: projects }, allWriting: { nodes: writing }, changelog: { nodes: [] }, newsletter: { nodes: [] }, allFile: { nodes: [] } })
  assert.equal(result.stories.length, 17)
  assert.deepEqual(result.stories.map(s => s.content), writing.map(s => s.content))
  assert.ok(result.stories.every(s => s.content.length > 100))
})

test('music lists albums and covers with factual metadata', () => {
  assert.equal(RELEASES.length, 9)
  assert.deepEqual(RELEASES.map(r => r.tracks), [16, 5, 8, 12, 15, 5, 12, 7, 4])
  assert.ok(RELEASES.every(r => r.cover && r.date && r.description && r.link.includes('/album/')))
  assert.deepEqual(COLORPULSE_ALBUMS.map(a => a.title), ['Plazma', 'Sorry', 'This Now'])
  assert.ok(COLORPULSE_ALBUMS.every(a => a.link.includes('/sets/')))
  assert.equal(creativeWrap(-1, 16), 15)
  assert.equal(creativeWrap(9, 9), 0)
})

test('reader and deck fit in their rooms at all required sizes', () => {
  for (const [width, height] of [[1440,813],[1366,768],[1280,720],[1024,768],[390,844]]) {
    const layout = creativeRoomLayout(width, height)
    assert.ok(layout.roomHeight > 0)
    assert.ok(layout.readerHeight >= 180, `${width} reader`)
    assert.ok(layout.musicHeight >= 180, `${width} music`)
    if (width >= 820) assert.ok(layout.roomWidth * 2 + layout.gap <= layout.stageWidth)
  }
})
