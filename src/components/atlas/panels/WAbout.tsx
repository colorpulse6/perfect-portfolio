import React from "react"
import { NB_MONO, NB_DISP } from "../atlasShared"
import { Spectral } from "../AtlasFog"
import { Wraith } from "../shells/Wraith"
import { WSPEC, lead } from "./styles"

// ── content fills ────────────────────────────────────────────────────
export function WAbout({ onClose }: { onClose: () => void }) {
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
