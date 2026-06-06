import React from "react"
import { NB_MONO } from "../atlasShared"
import type { AtlasWork, AtlasDomain } from "../atlasShared"
import { Spectral } from "../AtlasFog"
import { isVideo } from "../../../helpers/projectImages"
import { Wraith } from "../shells/Wraith"
import { WSPEC, WSTAT, lead, linkS } from "./styles"

export function WProject({
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
  const links = work?.links?.length ? work.links : link ? [{ cta, link }] : []
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
      {media &&
        (isVideo(media) ? (
          <video
            src={media}
            autoPlay
            loop
            muted
            playsInline
            aria-label={title}
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
        ) : (
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
        ))}
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
      {links.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 18,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 22,
          }}
        >
          {links.map(({ cta, link }) => (
            <a
              key={`${cta}-${link}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkS(accent), display: "inline-block" }}
            >
              {cta.toUpperCase()} →
            </a>
          ))}
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
