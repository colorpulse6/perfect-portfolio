import React from "react"
import { NB_MONO, NB_DISP } from "../../atlasShared"
import type { FictionStory } from "../../atlasShared"
import { formatTextContent, wrapWordsInSpans, revealDelay } from "../../../../helpers/wordReveal"
import { WSPEC, FICTION_ACCENT } from "../styles"

// The word-by-word reveal reader — reuses the shared wordReveal mechanics on the
// FULL story text (allWriting.content), not the prototype's simpler tokenizer.
export function StoryReveal({
  story,
  accent = FICTION_ACCENT,
  onBack,
}: {
  story: FictionStory
  accent?: string
  onBack: () => void
}) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const timerRef = React.useRef<number>(0)
  const spansRef = React.useRef<HTMLElement[]>([])
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    setDone(false)
    const contentEl = contentRef.current
    if (!contentEl) return
    contentEl.innerHTML = formatTextContent(story.content)
    const paragraphs = contentEl.querySelectorAll(".story-paragraph")
    const allWords: { span: HTMLElement; isParaEnd: boolean }[] = []
    paragraphs.forEach(p => {
      const words = wrapWordsInSpans(p as HTMLElement)
      words.forEach((span, i) => allWords.push({ span, isParaEnd: i === words.length - 1 }))
    })
    spansRef.current = allWords.map(w => w.span)

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      allWords.forEach(w => w.span.classList.add("visible"))
      setDone(true)
      return
    }

    let wi = 0
    const tick = () => {
      if (wi >= allWords.length) {
        setDone(true)
        return
      }
      const { span, isParaEnd } = allWords[wi]
      span.classList.add("visible")
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
      wi++
      const word = span.textContent || ""
      timerRef.current = window.setTimeout(tick, revealDelay(word, isParaEnd))
    }
    timerRef.current = window.setTimeout(tick, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [story])

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    spansRef.current.forEach(s => s.classList.add("visible"))
    setDone(true)
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        onClick={onBack}
        style={{
          fontFamily: NB_MONO,
          fontSize: 10,
          letterSpacing: 1.5,
          color: accent,
          marginBottom: 14,
          cursor: "pointer",
          pointerEvents: "auto",
          opacity: 0.85,
        }}
      >
        ← FICTION
      </div>
      <div
        style={{
          fontFamily: NB_DISP,
          fontSize: 30,
          fontWeight: 700,
          color: WSPEC.pale,
          letterSpacing: "-0.01em",
          marginBottom: 24,
          textShadow: `0 0 30px ${accent}66`,
          textAlign: "center",
          padding: "0 8%",
        }}
      >
        {story.title}
      </div>
      <div
        ref={bodyRef}
        className="atlas-reader-body"
        style={{
          maxWidth: 560,
          maxHeight: "44vh",
          overflow: "hidden",
          padding: "0 8px",
          textAlign: "left",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0, #000 40px, #000 calc(100% - 48px), transparent 100%)",
          maskImage:
            "linear-gradient(180deg, transparent 0, #000 40px, #000 calc(100% - 48px), transparent 100%)",
        }}
      >
        <div ref={contentRef} className="atlas-reader-content" />
        {!done && (
          <span className="atlas-reader-caret" style={{ color: accent }}>
            ▍
          </span>
        )}
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: NB_MONO,
          fontSize: 10,
          letterSpacing: 1,
          color: "rgba(150,180,200,0.5)",
          pointerEvents: "auto",
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        {!done ? (
          <span onClick={skip} style={{ cursor: "pointer", color: accent }}>
            SKIP REVEAL →
          </span>
        ) : (
          <span style={{ color: "rgba(150,180,200,0.45)" }}>· end ·</span>
        )}
      </div>
    </div>
  )
}
