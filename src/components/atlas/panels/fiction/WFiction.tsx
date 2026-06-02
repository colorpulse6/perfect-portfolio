import React from "react"
import { NB_MONO, NB_DISP } from "../../atlasShared"
import type { FictionStory } from "../../atlasShared"
import { WSPEC, FICTION_ACCENT } from "../styles"
import { FictionOverlay } from "./FictionOverlay"
import { StoryReveal } from "./StoryReveal"

// FICTION library → reader. Lists stories; selecting one reveals it in place.
export function WFiction({ fiction, onClose }: { fiction?: FictionStory[]; onClose: () => void }) {
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
