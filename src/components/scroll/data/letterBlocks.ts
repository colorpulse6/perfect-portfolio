import type { InlinePart, LetterBlock } from "./types.ts"

function inlineParts(source: string): InlinePart[] {
  const parts: InlinePart[] = []
  const token = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)|`([^`]+)`/g
  let start = 0
  for (const match of source.matchAll(token)) {
    const index = match.index ?? 0
    if (index > start) parts.push({ kind: "text", text: source.slice(start, index) })
    if (match[1]) parts.push({ kind: "link", text: match[1], href: match[2] })
    else parts.push({ kind: "code", text: match[3] })
    start = index + match[0].length
  }
  if (start < source.length) parts.push({ kind: "text", text: source.slice(start) })
  return parts
}

export function letterBlocks(raw: string): LetterBlock[] {
  // A trailing empty editorial comment exists in issue 12 and has no visible body.
  const source = raw.replace(/<!--\s*-->/g, "").trim()
  if (!source) return []
  return source.split(/\n\s*\n/).map(chunk => {
    const value = chunk.trim().replace(/\s*\n\s*/g, " ")
    if (/^## /.test(value)) return { kind: "heading", text: value.slice(3) }
    const image = /^!\[([^\]]+)\]\((\.\/img\/[^)]+)\)$/.exec(value)
    if (image) return { kind: "image", alt: image[1], src: image[2] }
    if (/^(?:#|[-*] |> |```|<)/.test(value) || /\*\*|\*[^*]+\*/.test(value)) {
      throw new Error(`Unsupported letter markdown: ${value.slice(0, 60)}`)
    }
    const parts = inlineParts(value)
    if (parts.some(part => part.kind === "text" && (part.text.includes("[") || part.text.includes("]") || part.text.includes("`")))) {
      throw new Error(`Unsupported letter markdown: ${value.slice(0, 60)}`)
    }
    return { kind: "paragraph", parts }
  })
}
