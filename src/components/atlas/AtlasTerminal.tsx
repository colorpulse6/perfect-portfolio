/**
 * The Atlas terminal: a small command console over the galaxy. Toggled with
 * T or the TERMINAL nav item. Shared by the WebGL Atlas and the classic one.
 */
import React, { useEffect, useRef, useState } from "react"
import { NB as A, NB_MONO as MONO } from "./atlasShared"

export function AtlasTerminal({ onClose }: { onClose: () => void }) {
  const CMDS: Record<string, string> = {
    help: "commands: about · work · obsidian · web · games · tools · ai · music · writing · contact · clear",
    about: "Seattle → Berlin → Madrid. Composer turned engineer. The medium changed; the discipline didn't.",
    work: "7 mediums indexed. Drag the atlas, or type a name: web, ai, games, music...",
    obsidian: "Brain Atlas + Cerebro Mycelium. Vault visualizers, live in the community store.",
    web: "Job Toast · Fire Store. Web apps, live and archived.",
    tools: "El Form · Claude Skills · Swash Flag · Bot Battle · Regexplain · Throttle. Libraries, SDKs, and dev tooling.",
    ai: "Cerebro. A native macOS multi-agent workspace orchestrating coding agents.",
    music: "Alex's Hand · 10 years · 10 albums · 12 countries → alexshand.bandcamp.com",
    games: "Knicks Knacks · Sector Zero. Procedural space, co-op in progress.",
    writing: "Agile Anarchy: What's Left. A postmortem on process worship.",
    contact: "open the CONTACT panel (bottom-left) to send a transmission.",
  }
  const QUOTES = [
    "The silence between the notes is where the meaning lives.",
    "Troubleshooting is troubleshooting. The domain is irrelevant.",
    "Arrangement is architecture.",
  ]
  const [lines, setLines] = useState<{ t: string; c: string }[]>(() => [
    { t: "CEREBRO ATLAS // terminal", c: A.cyan },
    { t: QUOTES[Math.floor(Math.random() * QUOTES.length)], c: A.fainter },
    { t: "type 'help' for commands.", c: A.faint },
  ])
  const [val, setVal] = useState("")
  const inRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    inRef.current && inRef.current.focus()
  }, [])
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines])
  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase()
    if (!cmd) return
    if (cmd === "clear") {
      setLines([])
      return
    }
    const out = CMDS[cmd] || `command not found: ${cmd}`
    setLines(l => [
      ...l,
      { t: `nic@atlas:~$ ${raw}`, c: A.paper },
      { t: out, c: CMDS[cmd] ? A.faint : A.pink },
    ])
  }
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%,-50%)",
        width: 560,
        maxWidth: "86%",
        height: 320,
        background: "rgba(6,7,16,0.92)",
        border: "1px solid rgba(72,226,214,0.22)",
        borderRadius: 12,
        boxShadow: "0 0 60px rgba(43,240,255,0.14), inset 0 0 40px rgba(43,240,255,0.03)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 70,
      }}
    >
      <div
        style={{
          height: 34,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          borderBottom: `1px solid ${A.line}`,
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 99, background: A.cyan }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: A.faint, flex: 1 }}>TERMINAL</span>
        <button type="button" aria-label="Close terminal" onClick={onClose} style={{ background: "none", border: "none", padding: 0, fontFamily: MONO, fontSize: 14, color: A.fainter, cursor: "pointer" }}>
          ✕
        </button>
      </div>
      <div
        ref={bodyRef}
        style={{ flex: 1, overflow: "auto", padding: "12px 14px", fontFamily: MONO, fontSize: 12, lineHeight: 1.7 }}
      >
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.c, whiteSpace: "pre-wrap" }}>
            {l.t}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderTop: `1px solid ${A.line}`,
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 12, color: A.cyan }}>nic@atlas:~$</span>
        <input
          ref={inRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              run(val)
              setVal("")
            }
          }}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: A.paper,
            fontFamily: MONO,
            fontSize: 12,
          }}
        />
      </div>
    </div>
  )
}
