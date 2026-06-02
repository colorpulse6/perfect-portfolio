import React from "react"
import { NB_MONO, NB_DISP } from "../atlasShared"
import type { EssayItem } from "../atlasShared"
import { Spectral } from "../AtlasFog"
import { Wraith } from "../shells/Wraith"
import { WSPEC, lead, linkS } from "./styles"

export function WWriting({ essays, onClose }: { essays?: EssayItem[]; onClose: () => void }) {
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
