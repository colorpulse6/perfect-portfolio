/**
 * AtlasPanels — the "wraith" panel system. When you click an orb or a nav item,
 * a panel condenses out of cold fog over the blurred galaxy. Ported from the
 * prototype's `portfolio-panels-ghost.jsx`, made data-driven:
 *   - WProject reads detail straight off the `work` object (no WDETAIL map).
 *   - WChangelog / WWriting / WFiction take changelog / essays / fiction props.
 *   - WContact is a real Netlify Forms submit (AJAX, inline confirmation).
 *   - StoryReveal reuses the shared word-by-word reveal mechanics on full text.
 * The prototype's AtlasClusterPanel + Wormhole are not ported — the router never
 * routes to a cluster panel (clicking a hub warps into its solar system instead).
 */
import React from "react"
import { NB, NB_MONO, NB_DISP } from "./atlasShared"
import type {
  AtlasWork,
  AtlasDomain,
  FictionStory,
  EssayItem,
  ChangelogItem,
} from "./atlasShared"
import { Mist, Spectral, SPEC } from "./AtlasFog"
import { formatTextContent, wrapWordsInSpans, revealDelay } from "../../helpers/wordReveal"

const WSPEC = SPEC
const WSTAT: Record<string, string> = {
  released: SPEC.glow,
  live: SPEC.glow,
  "in-progress": "#f2ab47",
  published: SPEC.bruise,
  archive: NB.pink,
  update: "#4aba7a",
  ongoing: "rgba(180,210,230,0.4)",
}
const FICTION_ACCENT = "#caa6f2"

// ── The Wraith shell: fog over the dimmed galaxy, floating chrome ─────
interface WraithProps {
  crumb: string[]
  accent?: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}
function Wraith({ crumb, accent = WSPEC.glow, onClose, children, wide }: WraithProps) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
      {/* veil: blur the galaxy into soft mist so labels don't conflict */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 100% at 50% 50%, rgba(3,4,10,0.55), rgba(2,3,8,0.84))",
          backdropFilter: "blur(16px) saturate(1.1)",
          WebkitBackdropFilter: "blur(16px) saturate(1.1)",
          cursor: "default",
        }}
      />
      {/* cold fog drifting over the galaxy (transparent base) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Mist presence hue={accent} solid={false} />
      </div>
      {/* floating breadcrumb */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 30,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: NB_MONO,
          fontSize: 10,
          letterSpacing: 2,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 99,
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
          }}
        />
        {crumb.map((c, i) => (
          <React.Fragment key={i}>
            <span style={{ color: i === crumb.length - 1 ? WSPEC.pale : "rgba(180,210,230,0.4)" }}>
              {c}
            </span>
            {i < crumb.length - 1 && <span style={{ color: "rgba(120,150,170,0.3)" }}>/</span>}
          </React.Fragment>
        ))}
      </div>
      <span
        onClick={onClose}
        style={{
          position: "absolute",
          top: 22,
          right: 30,
          fontFamily: NB_MONO,
          fontSize: 15,
          color: "rgba(180,210,230,0.5)",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        ✕
      </span>
      {/* content — centered, dissolves at edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: wide ? "0 10%" : "0 22%",
          pointerEvents: "none",
          WebkitMaskImage: "radial-gradient(82% 78% at 50% 50%, #000 32%, transparent 94%)",
          maskImage: "radial-gradient(82% 78% at 50% 50%, #000 32%, transparent 94%)",
        }}
      >
        {children}
      </div>
    </div>
  )
}

const lead: React.CSSProperties = {
  fontFamily: NB_DISP,
  fontSize: 14.5,
  lineHeight: 1.7,
  color: "rgba(207,234,255,0.64)",
  textShadow: `0 0 24px ${WSPEC.cold}55`,
}
const linkS = (c: string): React.CSSProperties => ({
  fontFamily: NB_MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.5,
  color: c,
  textDecoration: "none",
  pointerEvents: "auto",
})

// ── content fills ────────────────────────────────────────────────────
function WAbout({ onClose }: { onClose: () => void }) {
  const secs: [string, string][] = [
    [
      "SEATTLE",
      "obsessed with the architecture of creativity – tabletop worlds, comics, basements full of cables.",
    ],
    ["BERLIN", "tours across the US and Europe, then March 2020. I looked for a new medium."],
    ["MADRID", "AI returned me to my roots as an arranger – coordinating agents like a band."],
  ]
  return (
    <Wraith crumb={["ATLAS", "NICHALAS BARNES", "ORIGIN"]} accent={WSPEC.glow} onClose={onClose}>
      <div>
        <Spectral text="THE MEDIUM CHANGED" size={36} />
      </div>
      <div style={{ marginTop: 6 }}>
        <Spectral text="THE DISCIPLINE DIDN'T" size={36} color={WSPEC.glow} />
      </div>
      <p style={{ ...lead, maxWidth: 520, margin: "22px auto 0" }}>
        Software engineer who spent the first decade as a composer, bandleader, and audio
        technician – managing complexity into a seamless whole.
      </p>
      <div
        style={{
          display: "flex",
          gap: 38,
          justifyContent: "center",
          marginTop: 30,
          textAlign: "left",
          maxWidth: 720,
        }}
      >
        {secs.map(([l, b], i) => (
          <div key={i} style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: NB_MONO,
                fontSize: 9,
                letterSpacing: 2.5,
                color: WSPEC.glow,
                marginBottom: 6,
                opacity: 0.8,
              }}
            >
              {l}
            </div>
            <div
              style={{
                fontFamily: NB_DISP,
                fontSize: 11.5,
                lineHeight: 1.6,
                color: "rgba(190,215,235,0.5)",
              }}
            >
              {b}
            </div>
          </div>
        ))}
      </div>
    </Wraith>
  )
}

function WProject({
  work,
  domain,
  onClose,
}: {
  work?: AtlasWork
  domain?: AtlasDomain
  onClose: () => void
}) {
  const accent = WSPEC.glow
  const title = work ? work.t : "Project"
  const status = (work && work.status) || "released"
  const date = work && work.date
  const medium = work && work.medium
  const body = work && (work.body || work.meta)
  const media = work && work.media
  const tech = work && work.tech
  const link = work && work.link
  const cta = (work && work.cta) || "OPEN"
  const github = work && work.github
  const meta = [date, medium].filter(Boolean).join(" · ")
  return (
    <Wraith
      crumb={["ATLAS", domain ? domain.label : "WORK", title]}
      accent={accent}
      onClose={onClose}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <span
          style={{
            fontFamily: NB_MONO,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 2,
            color: WSTAT[status] || accent,
            textTransform: "uppercase",
          }}
        >
          {status}
        </span>
        {meta && (
          <span
            style={{
              fontFamily: NB_MONO,
              fontSize: 9,
              letterSpacing: 1.5,
              color: "rgba(150,180,200,0.5)",
            }}
          >
            {meta}
          </span>
        )}
      </div>
      <Spectral text={title} size={34} />
      {media && (
        <img
          src={media}
          alt={title}
          style={{
            width: 420,
            maxWidth: "70%",
            height: 240,
            objectFit: "contain",
            marginTop: 20,
            opacity: 0.9,
            WebkitMaskImage: "radial-gradient(115% 125% at 50% 45%, #000 70%, transparent 100%)",
            maskImage: "radial-gradient(115% 125% at 50% 45%, #000 70%, transparent 100%)",
          }}
        />
      )}
      <p style={{ ...lead, maxWidth: 480, margin: "18px auto 0" }}>{body}</p>
      {tech && tech.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            marginTop: 14,
            fontFamily: NB_MONO,
            fontSize: 9,
            letterSpacing: 1.5,
            color: "rgba(150,180,200,0.55)",
          }}
        >
          {tech.map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
      {link && (
        <div
          style={{
            display: "flex",
            gap: 18,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 22,
          }}
        >
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...linkS(accent), display: "inline-block" }}
          >
            {cta.toUpperCase()} →
          </a>
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkS("rgba(150,180,200,0.6)"), fontWeight: 400 }}
            >
              GITHUB
            </a>
          )}
        </div>
      )}
    </Wraith>
  )
}

function WWriting({ essays, onClose }: { essays?: EssayItem[]; onClose: () => void }) {
  const accent = WSPEC.bruise
  const list = essays || []
  const hero = list[0]
  if (!hero) {
    return (
      <Wraith crumb={["ATLAS", "WRITING"]} accent={accent} onClose={onClose}>
        <Spectral text="WRITING" size={32} color={WSPEC.pale} />
        <p style={{ ...lead, maxWidth: 480, margin: "20px auto 0", fontStyle: "italic" }}>
          Essays are on their way.
        </p>
      </Wraith>
    )
  }
  const heroMeta = [hero.status, hero.date].filter(Boolean).join(" · ").toUpperCase()
  const readLabel =
    hero.link && hero.link.includes("medium.com") ? "READ ON MEDIUM →" : "READ →"
  return (
    <Wraith crumb={["ATLAS", "WRITING", hero.t]} accent={accent} onClose={onClose} wide>
      {heroMeta && (
        <div
          style={{
            fontFamily: NB_MONO,
            fontSize: 9,
            letterSpacing: 2,
            color: accent,
            marginBottom: 14,
            opacity: 0.85,
          }}
        >
          {heroMeta}
        </div>
      )}
      <Spectral text={hero.t.toUpperCase()} size={32} color={WSPEC.pale} />
      {hero.body && (
        <p style={{ ...lead, maxWidth: 500, margin: "20px auto 0", fontStyle: "italic" }}>
          {hero.body}
        </p>
      )}
      {hero.link && (
        <a
          href={hero.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...linkS(accent), display: "inline-block", marginTop: 22 }}
        >
          {readLabel}
        </a>
      )}
      {list.length > 1 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 28,
            textAlign: "left",
            maxWidth: 460,
            pointerEvents: "auto",
          }}
        >
          {list.slice(1).map((e, i) => (
            <a
              key={i}
              href={e.link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  fontFamily: NB_MONO,
                  fontSize: 10,
                  color: "rgba(150,180,200,0.5)",
                  width: 72,
                  flexShrink: 0,
                }}
              >
                {e.date}
              </span>
              <span
                style={{
                  fontFamily: NB_DISP,
                  fontSize: 14,
                  color: "rgba(207,234,255,0.78)",
                  flex: 1,
                }}
              >
                {e.t}
              </span>
              <span style={{ fontFamily: NB_MONO, fontSize: 10, color: accent }}>→</span>
            </a>
          ))}
        </div>
      )}
    </Wraith>
  )
}

function WChangelog({
  changelog,
  onClose,
}: {
  changelog?: ChangelogItem[]
  onClose: () => void
}) {
  const entries = changelog || []
  return (
    <Wraith crumb={["ATLAS", "CHANGELOG"]} accent={WSPEC.glow} onClose={onClose} wide>
      <div
        style={{
          fontFamily: NB_MONO,
          fontSize: 9,
          letterSpacing: 3,
          color: WSPEC.glow,
          marginBottom: 22,
          opacity: 0.8,
        }}
      >
        SHIP LOG · NEWEST FIRST
      </div>
      <div
        className="atlas-scroll"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          textAlign: "left",
          width: 460,
          maxWidth: "84%",
          maxHeight: "56vh",
          overflowY: "auto",
          paddingRight: 12,
          pointerEvents: "auto",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)",
          maskImage:
            "linear-gradient(180deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)",
        }}
      >
        {entries.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 99,
                background: WSTAT[e.status || ""] || "rgba(180,210,230,0.4)",
                boxShadow: `0 0 8px ${WSTAT[e.status || ""] || "transparent"}`,
                flexShrink: 0,
                transform: "translateY(-2px)",
              }}
            />
            <span
              style={{
                fontFamily: NB_MONO,
                fontSize: 10,
                color: "rgba(150,180,200,0.5)",
                width: 72,
                flexShrink: 0,
              }}
            >
              {e.date}
            </span>
            <span style={{ fontFamily: NB_DISP, fontSize: 14, color: "rgba(207,234,255,0.78)", flex: 1 }}>
              {e.t}
            </span>
            <span
              style={{
                fontFamily: NB_MONO,
                fontSize: 8,
                letterSpacing: 1,
                color: WSTAT[e.status || ""] || "rgba(150,180,200,0.4)",
                textTransform: "uppercase",
              }}
            >
              {e.type}
            </span>
          </div>
        ))}
      </div>
    </Wraith>
  )
}

const encode = (data: Record<string, string>) =>
  Object.keys(data)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&")

function WContact({ onClose }: { onClose: () => void }) {
  const field: React.CSSProperties = {
    background: "rgba(180,210,230,0.05)",
    border: "1px solid rgba(111,216,224,0.18)",
    borderRadius: 8,
    padding: "11px 13px",
    fontFamily: NB_MONO,
    fontSize: 12,
    color: WSPEC.pale,
    outline: "none",
    width: "100%",
    pointerEvents: "auto",
  }
  const [form, setForm] = React.useState({ name: "", email: "", message: "" })
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error">("idle")
  const [err, setErr] = React.useState("")

  const transmit = async () => {
    if (state === "sending" || state === "sent") return
    if (!form.email.trim() && !form.message.trim()) {
      setErr("add an email or a message first.")
      setState("error")
      return
    }
    setState("sending")
    try {
      // Reuse the same Netlify form ("contact") the /contact page registers, via
      // AJAX so the immersive atlas isn't navigated away on submit.
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "contact", "bot-field": "", ...form }),
      })
      if (res.ok) {
        setState("sent")
      } else {
        setErr("transmission failed. try again in a moment.")
        setState("error")
      }
    } catch {
      setErr("transmission failed. try again in a moment.")
      setState("error")
    }
  }

  return (
    <Wraith crumb={["ATLAS", "CONTACT"]} accent={WSPEC.glow} onClose={onClose}>
      <Spectral text="OPEN A CHANNEL" size={30} mono />
      <p style={{ ...lead, maxWidth: 420, margin: "16px auto 22px" }}>
        For teams that value craft, taste, and the perspective that comes from a life spent
        building things from scratch.
      </p>
      {state === "sent" ? (
        <div
          style={{
            fontFamily: NB_MONO,
            fontSize: 13,
            letterSpacing: 1.5,
            color: WSPEC.glow,
            textShadow: `0 0 18px ${WSPEC.glow}66`,
          }}
        >
          TRANSMISSION RECEIVED ✓
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 360, maxWidth: "80%" }}>
          <input
            placeholder="your name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={field}
          />
          <input
            placeholder="email / signal"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            style={field}
          />
          <textarea
            placeholder="transmission…"
            rows={3}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            style={{ ...field, resize: "none" }}
          />
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            <span
              onClick={transmit}
              style={{ ...linkS(WSPEC.glow), cursor: state === "sending" ? "default" : "pointer" }}
            >
              {state === "sending" ? "TRANSMITTING…" : "TRANSMIT →"}
            </span>
            <a
              href="https://github.com/colorpulse6"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkS("rgba(150,180,200,0.6)"), fontWeight: 400 }}
            >
              GITHUB
            </a>
            <a
              href="https://alexshand.bandcamp.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkS("rgba(150,180,200,0.6)"), fontWeight: 400 }}
            >
              BANDCAMP
            </a>
          </div>
          {state === "error" && (
            <div
              style={{
                fontFamily: NB_MONO,
                fontSize: 10,
                letterSpacing: 1,
                color: NB.pink,
                textAlign: "center",
              }}
            >
              {err}
            </div>
          )}
        </div>
      )}
    </Wraith>
  )
}

// ── Fiction overlay chrome (veil + drifting fog + breadcrumb) ─────────
function FictionOverlay({
  crumbTail,
  accent = FICTION_ACCENT,
  onClose,
  children,
}: {
  crumbTail?: string
  accent?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 100% at 50% 50%, rgba(3,4,10,0.6), rgba(2,3,8,0.9))",
          backdropFilter: "blur(18px) saturate(1.1)",
          WebkitBackdropFilter: "blur(18px) saturate(1.1)",
          cursor: "default",
        }}
      />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Mist presence hue={accent} solid={false} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 30,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: NB_MONO,
          fontSize: 10,
          letterSpacing: 2,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 99,
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
          }}
        />
        <span style={{ color: "rgba(180,210,230,0.4)" }}>ATLAS</span>
        <span style={{ color: "rgba(120,150,170,0.3)" }}>/</span>
        <span style={{ color: "rgba(180,210,230,0.4)" }}>WRITING</span>
        <span style={{ color: "rgba(120,150,170,0.3)" }}>/</span>
        <span style={{ color: crumbTail ? "rgba(180,210,230,0.4)" : WSPEC.pale }}>FICTION</span>
        {crumbTail && (
          <React.Fragment>
            <span style={{ color: "rgba(120,150,170,0.3)" }}>/</span>
            <span style={{ color: WSPEC.pale }}>{crumbTail}</span>
          </React.Fragment>
        )}
      </div>
      <span
        onClick={onClose}
        style={{
          position: "absolute",
          top: 22,
          right: 30,
          fontFamily: NB_MONO,
          fontSize: 15,
          color: "rgba(180,210,230,0.5)",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        ✕
      </span>
      {children}
    </div>
  )
}

// The word-by-word reveal reader — reuses the shared wordReveal mechanics on the
// FULL story text (allWriting.content), not the prototype's simpler tokenizer.
function StoryReveal({
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

// FICTION library → reader. Lists stories; selecting one reveals it in place.
function WFiction({ fiction, onClose }: { fiction?: FictionStory[]; onClose: () => void }) {
  const stories = fiction || []
  const [sel, setSel] = React.useState<number | null>(null)
  const accent = FICTION_ACCENT
  if (sel !== null && stories[sel]) {
    return (
      <FictionOverlay crumbTail={stories[sel].title} accent={accent} onClose={onClose}>
        <StoryReveal story={stories[sel]} accent={accent} onBack={() => setSel(null)} />
      </FictionOverlay>
    )
  }
  return (
    <FictionOverlay accent={accent} onClose={onClose}>
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
          style={{
            fontFamily: NB_MONO,
            fontSize: 9,
            letterSpacing: 3,
            color: accent,
            opacity: 0.7,
            marginBottom: 12,
          }}
        >
          SHORT FICTION
        </div>
        <div
          style={{
            fontFamily: NB_DISP,
            fontSize: 30,
            fontWeight: 700,
            color: WSPEC.pale,
            letterSpacing: "-0.01em",
            marginBottom: 6,
            textShadow: `0 0 30px ${accent}66`,
          }}
        >
          Stories
        </div>
        <div
          style={{
            fontFamily: NB_DISP,
            fontSize: 13,
            fontStyle: "italic",
            color: "rgba(190,205,230,0.55)",
            marginBottom: 26,
          }}
        >
          Select a piece to read it.
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pointerEvents: "auto",
            width: 460,
            maxWidth: "84%",
            maxHeight: "52vh",
            overflowY: "auto",
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
            maskImage:
              "linear-gradient(180deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
          }}
        >
          {stories.map((st, i) => (
            <div
              key={i}
              onClick={() => setSel(i)}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                padding: "13px 14px",
                cursor: "pointer",
                borderRadius: 8,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(202,166,242,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span
                style={{
                  fontFamily: NB_MONO,
                  fontSize: 10,
                  color: "rgba(180,165,220,0.55)",
                  width: 22,
                  flexShrink: 0,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontFamily: NB_DISP,
                  fontSize: 16.5,
                  color: "rgba(222,230,248,0.92)",
                  flex: 1,
                  lineHeight: 1.3,
                }}
              >
                {st.title}
              </span>
              <span style={{ fontFamily: NB_MONO, fontSize: 11, color: accent, opacity: 0.7 }}>
                READ →
              </span>
            </div>
          ))}
        </div>
      </div>
    </FictionOverlay>
  )
}

export interface AtlasPanelState {
  type: "about" | "fiction" | "writing" | "changelog" | "contact" | "project"
  work?: AtlasWork
  domain?: AtlasDomain
}

export interface AtlasPanelRouterProps extends AtlasPanelState {
  fiction?: FictionStory[]
  essays?: EssayItem[]
  changelog?: ChangelogItem[]
  onClose: () => void
}

export function AtlasPanelRouter({
  type,
  work,
  domain,
  fiction,
  essays,
  changelog,
  onClose,
}: AtlasPanelRouterProps) {
  if (type === "about") return <WAbout onClose={onClose} />
  if (type === "fiction") return <WFiction fiction={fiction} onClose={onClose} />
  if (type === "writing") return <WWriting essays={essays} onClose={onClose} />
  if (type === "changelog") return <WChangelog changelog={changelog} onClose={onClose} />
  if (type === "contact") return <WContact onClose={onClose} />
  if (type === "project") return <WProject work={work} domain={domain} onClose={onClose} />
  return null
}
