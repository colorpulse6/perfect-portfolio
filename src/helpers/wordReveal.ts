// Word-by-word reveal mechanics, shared by the writing page and the atlas
// fiction reader. Extracted from writing.tsx so both consume the SAME logic:
//   - formatTextContent : story text -> paragraph HTML (dialogue, --, bold/italic)
//   - wrapWordsInSpans  : tree-walker that wraps each word in a .word-reveal span
//   - revealDelay       : per-word pause (longer after sentence/paragraph ends)
// Presentation (containers, CSS) stays with each consumer; only the mechanics
// live here. These functions touch the DOM, so they only run in the browser
// (called from effects/handlers, never at module load / SSR).

export const WORD_SPEED_BASE = 35
export const WORD_SPEED_JITTER = 20
export const WORD_PUNCT_PAUSE = 110
export const WORD_PARA_PAUSE = 300

export const formatTextContent = (text: string): string => {
  const paragraphs = text.split("\n\n")

  return paragraphs
    .map(paragraph => {
      let formattedParagraph = paragraph.replace(/\n/g, "<br />").trim()

      if (!formattedParagraph) {
        return "<br />"
      }

      formattedParagraph = formattedParagraph
        .replace(/--/g, "–")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")

      const leadingSpaces = paragraph.match(/^(\s+)/)
      const indentation = leadingSpaces
        ? leadingSpaces[1].replace(/ /g, "&nbsp;")
        : ""

      const isDialogue =
        formattedParagraph.includes("“") ||
        (formattedParagraph.startsWith('"') && formattedParagraph.includes('"'))

      const paragraphClass = isDialogue
        ? "story-paragraph dialogue-paragraph"
        : "story-paragraph"

      return `<p class="${paragraphClass}">${indentation}${formattedParagraph}</p>`
    })
    .join("")
}

export function wrapWordsInSpans(container: HTMLElement): HTMLElement[] {
  const allSpans: HTMLElement[] = []
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let current: Node | null
  while ((current = walker.nextNode())) {
    textNodes.push(current as Text)
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent || ""
    if (!text.trim()) continue

    const parts = text.split(/(\s+)/)
    const frag = document.createDocumentFragment()

    for (const part of parts) {
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part))
      } else if (part) {
        const span = document.createElement("span")
        span.className = "word-reveal"
        span.textContent = part
        span.style.setProperty("--w-seed", String(Math.random() * 4))
        frag.appendChild(span)
        allSpans.push(span)
      }
    }

    textNode.parentNode?.replaceChild(frag, textNode)
  }

  return allSpans
}

/** Delay (ms) before revealing the NEXT word, given the word just shown. */
export function revealDelay(word: string, isParaEnd: boolean): number {
  if (isParaEnd) {
    return WORD_PARA_PAUSE + Math.random() * 100
  }
  const isPunct = /[.!?,;:–]$/.test(word)
  if (isPunct) {
    return WORD_PUNCT_PAUSE + Math.random() * 60
  }
  return WORD_SPEED_BASE + (Math.random() - 0.5) * WORD_SPEED_JITTER * 2
}
