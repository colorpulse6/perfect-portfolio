export const creativeWrap = (index: number, count: number) => ((index % count) + count) % count

// Mirrors the CSS height budget. The browser harness checks the exact boxes.
export function creativeRoomLayout(viewWidth: number, viewHeight: number) {
  const phone = viewWidth < 820
  const stageWidth = Math.min(viewWidth - (phone ? 28 : 48), 1200)
  const gap = phone ? 0 : 26
  const roomWidth = phone ? stageWidth : (stageWidth - gap) / 2
  const headline = Math.max(30, Math.min(viewWidth * .046, 60)) * 1.1
  const roomHeight = phone
    ? viewHeight - 90 - 58 - headline - 44 - 8
    : viewHeight - 54 - 82 - headline - 12
  const readerHeight = roomHeight - 166
  const musicHeight = roomHeight - 196
  return { stageWidth, gap, roomWidth, roomHeight, readerHeight, musicHeight }
}
