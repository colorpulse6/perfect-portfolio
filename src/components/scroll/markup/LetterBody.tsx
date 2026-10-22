import React from "react"
import type { LetterBlock } from "../data/types"

export function LetterBody({ blocks }: { blocks: LetterBlock[] }) {
  return <>{blocks.map((block, index) => {
    if (block.kind === "heading") return <h4 key={index}>{block.text}</h4>
    if (block.kind === "image") return <figure key={index}><img src={block.src} alt={block.alt} loading="lazy" decoding="async" /><figcaption>{block.alt}</figcaption></figure>
    return <p key={index}>{block.parts.map((part, i) => part.kind === "link" ? <a key={i} href={part.href}>{part.text}</a> : part.kind === "code" ? <code key={i}>{part.text}</code> : <React.Fragment key={i}>{part.text}</React.Fragment>)}</p>
  })}</>
}
