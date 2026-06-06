import React from "react"
import { graphql } from "gatsby"
import TransitionLink from "gatsby-plugin-transition-link"
import SEO from "../components/seo"
import SideBarCollapsed from "../components/SideBarCollapsed"
import { GatsbyLocation } from "../types/gatsby"
import { usePageTransition } from "../helpers/usePageTransition"
import { softwareApplication, breadcrumb } from "../helpers/structuredData"
import { resolveProjectMedia, isVideo } from "../helpers/projectImages"

const SITE_URL = "https://nichalasbarnes.com"

interface ProjectNode {
  name: string
  slug: string
  description: string
  link: string
  cta?: string | null
  secondaryLink?: string | null
  secondaryCta?: string | null
  github: string | null
  medium: string
  status: string
  tech: string[]
  imgSrc: string
  cluster: string
}

interface ProjectTemplateProps {
  transitionStatus?: string
  location: GatsbyLocation
  data: { project: ProjectNode }
}

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 22px",
  border: "1px solid rgba(54,230,219,0.35)",
  borderRadius: 999,
  color: "rgba(238,242,255,0.92)",
  fontFamily: "Courier New, monospace",
  fontSize: 12,
  letterSpacing: 2,
  textTransform: "uppercase",
  textDecoration: "none",
}

const ProjectTemplate: React.FC<ProjectTemplateProps> = ({
  transitionStatus,
  location,
  data,
}) => {
  const p = data.project
  usePageTransition(transitionStatus, ".project-detail", { enter: 1, exit: 0.3, mount: 1 })

  const media = resolveProjectMedia(p.name, p.imgSrc)
  const isPortraitProject = p.name === "Throttle" || p.name === "Sector Zero"
  const mediaStyle: React.CSSProperties = isPortraitProject
    ? { width: "min(420px, 100%)", display: "block", margin: "0 auto 30px", borderRadius: 12 }
    : { width: "100%", borderRadius: 12, marginBottom: 30 }
  const pageUrl = `${SITE_URL}/projects/${p.slug}/`
  const schema = [
    softwareApplication({
      name: p.name,
      description: p.description,
      link: p.link,
      github: p.github,
      cluster: p.cluster,
    }),
    breadcrumb([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "Projects", url: `${SITE_URL}/projects/` },
      { name: p.name, url: pageUrl },
    ]),
  ]

  return (
    <>
      <SideBarCollapsed
        currentWindow={location.pathname}
        transitionStatus={transitionStatus}
        menuLinks={[]}
      />
      <div
        style={{ opacity: 0, position: "relative", zIndex: 2 }}
        className="project-detail"
      >
        <SEO title={p.name} description={p.description} pathname={location?.pathname} schema={schema} />
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "120px 24px 90px" }}>
          <TransitionLink
            to="/projects"
            exit={{ length: 0.5 }}
            entry={{ length: 0.5 }}
            style={{
              color: "rgba(150,165,210,0.7)",
              fontFamily: "Courier New, monospace",
              fontSize: 12,
              letterSpacing: 2,
              textDecoration: "none",
            }}
          >
            ← PROJECTS
          </TransitionLink>

          <h1 style={{ fontSize: 38, margin: "20px 0 8px", color: "rgba(238,242,255,0.95)" }}>
            {p.name}
          </h1>
          <div
            style={{
              fontFamily: "Courier New, monospace",
              fontSize: 12,
              letterSpacing: 2,
              color: "rgba(150,165,210,0.7)",
              textTransform: "uppercase",
              marginBottom: 30,
            }}
          >
            {p.medium} · {p.status}
          </div>

          {media &&
            (isVideo(media) ? (
              <video
                src={media}
                autoPlay
                loop
                muted
                playsInline
                aria-label={`${p.name} preview`}
                style={mediaStyle}
              />
            ) : (
              <img
                src={media}
                alt={`${p.name} screenshot`}
                loading="lazy"
                style={mediaStyle}
              />
            ))}

          <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(210,218,240,0.9)" }}>
            {p.description}
          </p>

          {p.tech && p.tech.length > 0 && (
            <p
              style={{
                fontFamily: "Courier New, monospace",
                fontSize: 13,
                color: "rgba(150,165,210,0.7)",
                marginTop: 24,
              }}
            >
              Built with: {p.tech.join(" · ")}
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 36 }}>
            {p.link && (
              <a href={p.link} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                {p.cta || "Visit"} ↗
              </a>
            )}
            {p.secondaryLink && (
              <a href={p.secondaryLink} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                {p.secondaryCta || "Site"} ↗
              </a>
            )}
            {p.github && (
              <a href={p.github} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                GitHub ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export const query = graphql`
  query ($slug: String!) {
    project(slug: { eq: $slug }) {
      name
      slug
      description
      link
      cta
      secondaryLink
      secondaryCta
      github
      medium
      status
      tech
      imgSrc
      cluster
    }
  }
`

export default ProjectTemplate
