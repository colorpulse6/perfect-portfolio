import React, { useState, useEffect, useRef, useCallback } from "react"
import { navigate } from "gatsby"
import { CYCLING_QUOTES, TERMINAL_COMMANDS, ArtifactDef, getRandomFallback } from "./artifacts"
import { useInteractionSounds } from "../audio/useInteractionSounds"
import "./TerminalConsole.css"

interface TerminalConsoleProps {
  pagePath?: string
}

const TYPE_SPEED_BASE = 65
const TYPE_SPEED_JITTER = 30
const PUNCTUATION_PAUSE = 280
const HOLD_DURATION = 5000
const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/": "the home page with floating artifacts and particle nebula",
  "/about/": "the about/origin story page",
  "/projects/": "the portfolio/projects page",
  "/writing/": "the creative writing page with short stories",
  "/changelog/": "the changelog/timeline page showing recent work",
  "/contact/": "the contact page",
}

const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  pagePath = "/",
}) => {
  const playSound = useInteractionSounds()
  const isHome = pagePath === "/" || pagePath === ""
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(!isHome)
  const [displayText, setDisplayText] = useState("")
  const [commandInput, setCommandInput] = useState("")
  const [responseText, setResponseText] = useState("")
  const [exploreLink, setExploreLink] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cycleIndex = useRef(0)
  const cycleTimer = useRef<NodeJS.Timeout | null>(null)
  const typeTimer = useRef<NodeJS.Timeout | null>(null)
  const isPaused = useRef(false)

  const typeText = useCallback(
    (text: string, onComplete?: () => void) => {
      let i = 0
      setDisplayText("")
      const tick = () => {
        if (i < text.length) {
          setDisplayText(text.substring(0, i + 1))
          const char = text[i]
          i++
          const isPunctuation = ".!?,;:".includes(char)
          const delay = isPunctuation
            ? PUNCTUATION_PAUSE + Math.random() * 120
            : TYPE_SPEED_BASE + (Math.random() - 0.5) * TYPE_SPEED_JITTER * 2
          typeTimer.current = setTimeout(tick, delay)
        } else if (onComplete) {
          onComplete()
        }
      }
      tick()
    },
    []
  )

  const startCycle = useCallback(() => {
    if (isPaused.current) return

    const quote = CYCLING_QUOTES[cycleIndex.current % CYCLING_QUOTES.length]
    setExploreLink(null)
    typeText(quote, () => {
      cycleTimer.current = setTimeout(() => {
        cycleIndex.current++
        startCycle()
      }, HOLD_DURATION)
    })
  }, [typeText])

  // On home: auto-show and cycle. On other pages: stay collapsed.
  useEffect(() => {
    if (isHome) {
      setCollapsed(false)
      const showTimer = setTimeout(() => {
        setVisible(true)
        startCycle()
      }, 500)
      return () => {
        clearTimeout(showTimer)
        if (cycleTimer.current) clearTimeout(cycleTimer.current)
        if (typeTimer.current) clearTimeout(typeTimer.current)
      }
    } else {
      setCollapsed(true)
      setVisible(false)
      isPaused.current = true
      if (cycleTimer.current) clearTimeout(cycleTimer.current)
      if (typeTimer.current) clearTimeout(typeTimer.current)
    }
  }, [isHome, startCycle])

  // Listen for artifact activation events from DomArtifacts
  useEffect(() => {
    const handler = (e: Event) => {
      const artifact = (e as CustomEvent<ArtifactDef>).detail
      if (!artifact) return

      isPaused.current = true
      if (cycleTimer.current) clearTimeout(cycleTimer.current)
      if (typeTimer.current) clearTimeout(typeTimer.current)

      setCollapsed(false)
      setVisible(true)
      const link = artifact.link || artifact.externalLink
      setExploreLink(link)

      typeText(artifact.quote, () => {
        setTimeout(() => {
          isPaused.current = false
          if (isHome) {
            cycleIndex.current++
            startCycle()
          }
        }, HOLD_DURATION)
      })
    }

    window.addEventListener("terminal-artifact", handler)
    return () => window.removeEventListener("terminal-artifact", handler)
  }, [typeText, startCycle, isHome])

  const askTerminal = useCallback(
    async (input: string) => {
      isPaused.current = true
      if (cycleTimer.current) clearTimeout(cycleTimer.current)
      if (typeTimer.current) clearTimeout(typeTimer.current)

      setResponseText("")
      setCommandInput("")
      setDisplayText("...")

      const pageDesc = PAGE_DESCRIPTIONS[pagePath] || "a page on the portfolio"
      let reply: string
      try {
        const urls = [
          "/.netlify/functions/chat",
          "http://localhost:9999/.netlify/functions/chat",
        ]
        let data: any = null
        for (const url of urls) {
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: input,
                context: { page: pagePath, pageDescription: pageDesc },
              }),
            })
            data = await res.json()
            if (res.ok && data?.reply) break
          } catch {
            continue
          }
        }
        reply = data?.reply || data?.error || getRandomFallback()
      } catch {
        reply = getRandomFallback()
      }
      typeText(reply, () => {
        setTimeout(() => {
          isPaused.current = false
          if (isHome) {
            cycleIndex.current++
            startCycle()
          }
        }, HOLD_DURATION)
      })
    },
    [typeText, startCycle, isHome, pagePath]
  )

  const handleCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase()
      if (!trimmed) return

      // Page-specific commands
      if (pagePath === "/changelog/" && trimmed === "latest") {
        isPaused.current = true
        if (cycleTimer.current) clearTimeout(cycleTimer.current)
        if (typeTimer.current) clearTimeout(typeTimer.current)
        setResponseText("")
        setCommandInput("")
        typeText("Scrolling to the most recent entry...", () => {
          const firstEntry = document.querySelector(".changelog-entry")
          if (firstEntry) firstEntry.scrollIntoView({ behavior: "smooth" })
          setTimeout(() => {
            isPaused.current = false
            if (isHome) startCycle()
          }, HOLD_DURATION)
        })
        return
      }

      const command = TERMINAL_COMMANDS[trimmed]

      if (!command) {
        askTerminal(cmd.trim())
        return
      }

      if (command.action === "clear") {
        setDisplayText("")
        setResponseText("")
        setCommandInput("")
        if (!isHome) {
          setCollapsed(true)
          setVisible(false)
        } else {
          setVisible(false)
        }
        return
      }

      isPaused.current = true
      if (cycleTimer.current) clearTimeout(cycleTimer.current)
      if (typeTimer.current) clearTimeout(typeTimer.current)

      setResponseText("")
      setCommandInput("")
      typeText(command.response, () => {
        if (command.action === "navigate" && command.target) {
          setTimeout(() => navigate(command.target!), 800)
        } else if (command.action === "external" && command.target) {
          setTimeout(() => window.open(command.target, "_blank"), 800)
        } else {
          setTimeout(() => {
            isPaused.current = false
            if (isHome) startCycle()
          }, HOLD_DURATION)
        }
      })
    },
    [typeText, startCycle, isHome, askTerminal, pagePath]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand(commandInput)
    }
  }

  const handleExploreClick = () => {
    if (!exploreLink) return
    if (exploreLink.startsWith("http")) {
      window.open(exploreLink, "_blank")
    } else {
      navigate(exploreLink)
    }
  }

  const expandFromCollapsed = () => {
    setCollapsed(false)
    setVisible(true)
    setDisplayText("")
    isPaused.current = true
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  if (collapsed) {
    return (
      <div className="terminal-collapsed" onClick={expandFromCollapsed}>
        &gt;_
      </div>
    )
  }

  return (
    <div className={`terminal-console${visible ? " visible" : ""}`}>
      <button
        className="terminal-dismiss"
        onClick={() => {
          if (isHome) {
            setVisible(false)
          } else {
            setCollapsed(true)
            setVisible(false)
          }
        }}
      >
        x
      </button>
      <div className="terminal-dots">
        <div className="terminal-dot" />
        <div className="terminal-dot" />
        <div className="terminal-dot" />
      </div>
      <div className="terminal-line">
        {displayText}
        {exploreLink && displayText.length > 0 && (
          <span className="explore-link" onClick={handleExploreClick}>
            explore &rarr;
          </span>
        )}
      </div>
      {responseText && (
        <div className="terminal-line" style={{ color: "rgba(255,255,255,0.35)" }}>
          {responseText}
        </div>
      )}
      <div className="terminal-input-line">
        <span className="terminal-prompt">&gt;</span>
        <input
          ref={inputRef}
          className="terminal-input"
          type="text"
          value={commandInput}
          onChange={(e) => {
            setCommandInput(e.target.value)
            playSound("keystroke")
          }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}

export default TerminalConsole
