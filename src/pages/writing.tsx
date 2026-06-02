import React, { useEffect, useState, useRef, useCallback } from "react"
import "./writing.css"
import { graphql, useStaticQuery } from "gatsby"
import gsap from "gsap"
import SEO from "../components/seo"
import {
  formatTextContent,
  wrapWordsInSpans,
  revealDelay,
} from "../helpers/wordReveal"

interface WritingItem {
  title: string
  content: string
}

interface WritingQueryData {
  allWriting: {
    nodes: WritingItem[]
  }
}

interface GatsbyLocation {
  pathname: string
}

interface WritingProps {
  transitionStatus?: string
  location?: GatsbyLocation
}

// Reveal mechanics (formatter, tree-walker, per-word timing) live in
// helpers/wordReveal.ts and are shared with the atlas fiction reader.

const Writing: React.FC<WritingProps> = ({ transitionStatus, location }) => {
  const data: WritingQueryData = useStaticQuery(graphql`
    query MyWritingQuery {
      allWriting {
        nodes {
          title
          content
        }
      }
    }
  `)

  const [activeStory, setActiveStory] = useState<string | null>(null)
  const [readerMode, setReaderMode] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const readerRef = useRef<HTMLDivElement>(null)
  const revealTimer = useRef<number>(0)
  const storiesData = data.allWriting.nodes

  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".writings", { autoAlpha: 1, duration: 1 })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".writings", { autoAlpha: 0, duration: 0.03 })
    }
  }, [transitionStatus])

  useEffect(() => {
    gsap.to(".writings", { autoAlpha: 1, duration: 0.5 })
  }, [])

  const stopReveal = useCallback(() => {
    if (revealTimer.current) {
      clearTimeout(revealTimer.current)
      revealTimer.current = 0
    }
  }, [])

  const openStory = useCallback((title: string) => {
    stopReveal()
    setActiveStory(title)
    setReaderMode(true)
    setScrollProgress(0)

    requestAnimationFrame(() => {
      gsap.fromTo(
        ".reader-container",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8, ease: "power1.out" }
      )

      // Wrap title words and reveal them
      const titleEl = document.querySelector<HTMLElement>(".reader-title")
      if (titleEl) {
        const titleWords = wrapWordsInSpans(titleEl)
        let ti = 0
        const revealTitle = () => {
          if (ti >= titleWords.length) return
          titleWords[ti].classList.add("visible")
          ti++
          const delay = 80 + Math.random() * 40
          setTimeout(revealTitle, delay)
        }
        setTimeout(revealTitle, 400)
      }

      // Wrap content words and reveal them
      const contentEl = document.querySelector<HTMLElement>(".reader-content")
      if (contentEl) {
        const paragraphs = contentEl.querySelectorAll(".story-paragraph")
        const allWords: { span: HTMLElement; isParaEnd: boolean }[] = []

        paragraphs.forEach((p) => {
          const words = wrapWordsInSpans(p as HTMLElement)
          words.forEach((span, i) => {
            allWords.push({ span, isParaEnd: i === words.length - 1 })
          })
        })

        let wi = 0
        const revealContent = () => {
          if (wi >= allWords.length) return
          const { span, isParaEnd } = allWords[wi]
          span.classList.add("visible")
          wi++

          const word = span.textContent || ""
          const delay = revealDelay(word, isParaEnd)

          revealTimer.current = window.setTimeout(revealContent, delay)
        }
        // Start content reveal after title has time to begin
        revealTimer.current = window.setTimeout(revealContent, 1200)
      }
    })
  }, [stopReveal])

  const closeReader = useCallback(() => {
    stopReveal()
    gsap.to(".reader-container", {
      autoAlpha: 0,
      y: -20,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setReaderMode(false)
        setActiveStory(null)
        setScrollProgress(0)
      },
    })
  }, [stopReveal])

  useEffect(() => {
    return () => stopReveal()
  }, [stopReveal])

  useEffect(() => {
    if (!readerMode) return

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setScrollProgress(Math.min(1, scrollTop / docHeight))
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [readerMode])

  const currentStory = storiesData.find(s => s.title === activeStory)

  return (
    <div style={{ opacity: 0, position: "relative" }} className="writings">
      <SEO title="writings" description="Short fiction and essays by Nichalas Barnes." pathname={location?.pathname} />

      {readerMode && currentStory ? (
        <div className="reader-container" ref={readerRef}>
          <div
            className="reader-progress"
            style={{ transform: `scaleY(${scrollProgress})` }}
          />

          <nav className="reader-nav">
            <button className="reader-back" onClick={closeReader}>
              &larr; Stories
            </button>
            <div className="reader-nav-titles">
              {storiesData.map((s, i) => (
                <button
                  key={i}
                  className={`reader-nav-title${s.title === activeStory ? " active" : ""}`}
                  onClick={() => {
                    if (s.title !== activeStory) {
                      stopReveal()
                      gsap.to(".reader-body", {
                        autoAlpha: 0,
                        duration: 0.2,
                        onComplete: () => openStory(s.title),
                      })
                    }
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </nav>

          <article className="reader-body">
            <h1 className="reader-title">{currentStory.title}</h1>
            <div
              className="reader-content"
              dangerouslySetInnerHTML={{
                __html: formatTextContent(currentStory.content),
              }}
            />
          </article>
        </div>
      ) : (
        <>
          <div className="writing">
            <h1>The ruptured adventures of a crafted coil</h1>
          </div>

          <div className="title-container" id="examples">
            {storiesData.map((storyItem, index) => (
              <div
                key={index}
                className="story-card"
                onClick={() => openStory(storyItem.title)}
              >
                <div className="example">
                  <span className="hover hover-1 story-item">
                    {storyItem.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Writing
