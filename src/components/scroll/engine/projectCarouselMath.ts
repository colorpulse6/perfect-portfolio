export const wrapIndex = (index: number, count: number) => ((index % count) + count) % count

export function orbitPoint(index: number, position: number, count: number, width: number, height: number) {
  const wide = width >= 820
  // the orbit area leaves room below for the controls; the ring is sized so every moon and its
  // name stay inside it (vertical reach of the tilted ellipse is 1.34 r wide, 1.36 r phone)
  const area = wide ? height - 52 : Math.min(height, 237)
  const radius = wide
    ? Math.max(60, Math.min((area / 2 - 81) / 1.34, width * 0.2))
    : Math.max(40, Math.min((area / 2 - 56) / 1.36, (width - 80) / 3.1))
  const cx = wide ? radius * 1.03 + 62 : radius * 1.5 + 40
  const cy = area / 2
  const a = radius * 1.35
  const b = radius * (wide ? 1 : 1.5)
  let distance = wrapIndex(index - position, count)
  if (distance >= count / 2) distance -= count
  const phi = distance * 2 * Math.PI / count
  const cosine = Math.cos(phi)
  const depth = (cosine + 1) / 2
  const front = Math.max(0, 1 - Math.abs(distance)) ** 3
  const size = (wide ? 90 : 58) * (0.62 + 0.38 * depth) * (1 + 0.3 * front)
  const tilt = 12 * Math.PI / 180
  const lx = b * cosine
  const ly = a * Math.sin(phi)
  const x = cx + lx * Math.cos(tilt) - ly * Math.sin(tilt)
  const y = cy + lx * Math.sin(tilt) + ly * Math.cos(tilt)
  const hidden = (cosine < 0 && Math.hypot(x - cx, y - cy) + size / 2 < radius) || x + size / 2 < 0
  return { x, y, size, radius, cx, cy, area, depth, front, hidden, opacity: 0.45 + 0.55 * Math.max(depth, front), z: (cosine < 0 ? 100 : 300) + Math.round(depth * 90) }
}
