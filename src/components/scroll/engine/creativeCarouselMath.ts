export type Box = { x: number; y: number; width: number; height: number }
export const creativeWrap = (index: number, count: number) => ((index % count) + count) % count

export function storyGeometry(width: number, height: number, active = 0) {
  const beadSize = width < 400 ? 24 : 27
  const activeSize = width < 400 ? 36 : 40
  const rx = Math.min(width * .42 - activeSize / 2, 205)
  const ry = Math.min(height * .35 - activeSize / 2, 116)
  const cx = width / 2, cy = height / 2
  const beads = Array.from({ length: 16 }, (_, index) => {
    const angle = (index - active) * Math.PI / 8
    const size = index === active ? activeSize : beadSize
    const x = cx + rx * Math.cos(angle) - ry * .17 * Math.sin(angle) - size / 2
    const y = cy + ry * Math.sin(angle) + rx * .1 * Math.cos(angle) - size / 2
    return { x, y, width: size, height: size }
  })
  const planetSize = Math.min(width * .53, height * .76, 244)
  return { planet: { x: cx - planetSize / 2, y: cy - planetSize / 2, width: planetSize, height: planetSize }, beads }
}

export function recordGeometry(width: number, height: number, active = 0) {
  const size = Math.min(height * .86, width * .48, 205)
  const rear = Math.min(size * .47, 95)
  const frontX = Math.max(12, width * .2 - 20)
  const frontY = (height - size) / 2
  const records = Array.from({ length: 9 }, (_, index) => {
    if (index === active) return { x: frontX, y: frontY, width: size, height: size }
    const distance = creativeWrap(index - active - 1, 9)
    return { x: Math.min(width - rear - 4, frontX + size * .72 + distance * Math.min(15, width * .028)), y: Math.max(2, Math.min(height - rear - 2, (height - rear) / 2 + (distance - 3.5) * Math.min(18, height * .074))), width: rear, height: rear }
  })
  return records
}

// Mirrors the CSS stage allocation for a testable fit envelope. All child boxes are local to a world.
export function creativeLayout(viewWidth: number, viewHeight: number, story = 0, record = 0) {
  const phone = viewWidth < 820
  const totalWidth = Math.min(viewWidth - (phone ? 28 : 48), 1200)
  const gap = phone ? 0 : 26
  const width = phone ? totalWidth : (totalWidth - gap) / 2
  const height = Math.max(420, viewHeight - (phone ? 158 : 177))
  const stories = { x: 0, y: 0, width, height }
  const music = { x: phone ? 0 : width + gap, y: 0, width, height }
  const orbitHeight = Math.min(phone ? 245 : 285, height * .59)
  const { planet, beads } = storyGeometry(width, orbitHeight, story)
  const deckHeight = Math.min(phone ? 205 : 235, height * .46)
  const records = recordGeometry(width, deckHeight, record).map(r => ({ ...r, y: r.y + (phone ? 50 : 60) }))
  const storyCard = { x: 0, y: orbitHeight + 12, width, height: 100 }
  const recordCard = { x: 0, y: deckHeight + (phone ? 60 : 70), width, height: 112 }
  return {
    stories, music, planet, beads,
    storyCard, recordCard,
    labels: {
      story: { x: 78, y: storyCard.y + 10, width: Math.max(0, width - 90), height: 80 },
      record: { x: 110, y: recordCard.y + 10, width: Math.max(0, width - 122), height: 92 },
    },
    records,
    controls: {
      stories: { x: 0, y: height - 42, width, height: 40 },
      music: { x: 0, y: height - 42, width, height: 40 },
    },
  }
}
