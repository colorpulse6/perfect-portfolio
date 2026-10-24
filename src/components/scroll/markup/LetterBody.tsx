import React from "react"
import type { LetterBlock } from "../data/types"

export function LetterBody({ blocks }: { blocks: LetterBlock[] }) {
  return <>{blocks.map((block, index) => {
    if (block.kind === "heading") return <h4 key={index}>{block.text}</h4>
    // as the prototype: the caption carries the picture's words (alt stays empty, so they are read once);
    // data-src names the source file behind the hashed src
    if (block.kind === "image") return <figure key={index}><img src={block.src} data-src={block.file} alt="" loading="lazy" decoding="async" /><figcaption>{block.alt}</figcaption></figure>
    return <p key={index}>{block.parts.map((part, i) => part.kind === "link" ? <a key={i} href={part.href} target="_blank" rel="noopener">{part.text}</a> : part.kind === "code" ? <code key={i}>{part.text}</code> : <React.Fragment key={i}>{part.text}</React.Fragment>)}</p>
  })}</>
}
