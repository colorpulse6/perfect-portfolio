import React, { useEffect, useMemo, useState } from "react"
import { graphql } from "gatsby"
import gsap from "gsap"
import SEO from "../components/seo"
import AtlasCanvas from "../components/atlas/AtlasCanvas"
import { CosmosAtlas } from "../components/atlas/CosmosAtlas"
import { useCosmos } from "../components/cosmos/cosmosStore"
import { resolveProjectMedia } from "../helpers/projectImages"
import { buildAtlasModel } from "../components/atlas/buildAtlasModel"
import { GatsbyLocation } from "../types/gatsby"
import { usePageTransition } from "../helpers/usePageTransition"
import "./atlas.css"

interface ProjectNode {
  name: string
  description: string
  link: string
  cta?: string | null
  secondaryLink?: string | null
  secondaryCta?: string | null
  github: string | null
  imgSrc: string
  techArray: number[]
  ref: string
  cluster: string
  status: string
  medium: string
  tech: string[]
  disabled?: boolean
}
interface WritingNode {
  title: string
  content: string
}
interface MarkdownNode {
  frontmatter: {
    title: string
    date: string
    type: string
    status: string | null
    project: string | null
    link: string | null
    media: string | null
  }
  excerpt: string
}

interface AtlasPageProps {
  transitionStatus?: string
  location: GatsbyLocation
  data: {
    allProject: { nodes: ProjectNode[] }
    allWriting: { nodes: WritingNode[] }
    allMarkdownRemark: { nodes: MarkdownNode[] }
  }
}

const AtlasPage: React.FC<AtlasPageProps> = ({ transitionStatus, location, data }) => {
  // After the wormhole journey the stage reveals the HUD (hudVisible) once
  // the hand-off settles, instead of the usual mount fade.
  const viaJourney = !!(location.state as { viaJourney?: boolean } | null)?.viaJourney
  const hudVisible = useCosmos((s) => s.hudVisible)
  usePageTransition(transitionStatus, ".atlas-page", { enter: 1, exit: 0.4, mount: 1, intro: !viaJourney })
  useEffect(() => {
    if (!viaJourney || !hudVisible) return
    gsap.to(".atlas-page", { autoAlpha: 1, duration: 0.6 })
    // The home CTA that had focus is gone: give keyboard and screen-reader
    // visitors a defined arrival point, unless something else took focus
    // (Gatsby's router parks focus on its wrapper after every route change).
    const active = document.activeElement
    if (!active || active === document.body || active.id === "gatsby-focus-wrapper") {
      document.getElementById("atlas-title")?.focus({ preventScroll: true })
    }
  }, [viaJourney, hudVisible])

  // The WebGL Atlas is the default; the classic Canvas2D Atlas remains the
  // fallback without WebGL2, after a lost context, or with ?atlas-legacy.
  const support = useCosmos((s) => s.support)
  const [legacyFlag, setLegacyFlag] = useState(false)
  useEffect(() => {
    setLegacyFlag(/atlas-legacy/.test(window.location.search))
  }, [])
  // Once the WebGL Atlas fails on this visit, keep the classic one until the
  // next visit, so a restored context does not swap views (and drop an open
  // panel or terminal) under the visitor.
  const [fellBack, setFellBack] = useState(false)
  useEffect(() => {
    if (support === "unsupported" || support === "lost") setFellBack(true)
  }, [support])
  const legacy = legacyFlag || fellBack || support === "unsupported" || support === "lost"

  const model = useMemo(
    () =>
      buildAtlasModel(
        {
          projects: data.allProject.nodes,
          writing: data.allWriting.nodes,
          changelog: data.allMarkdownRemark.nodes,
        },
        { resolveMedia: resolveProjectMedia }
      ),
    [data]
  )

  const { domains, fiction, essays, changelog } = model

  return (
    <div className={legacy ? "atlas-page" : "atlas-page atlas-page--cosmos"} style={{ opacity: 0 }}>
      <SEO title="Atlas" description="A 3D galaxy-map of Nichalas Barnes' work. Drag to rotate, dive into a cluster, and explore projects, essays, and fiction." pathname={location?.pathname} />
      <h1 id="atlas-title" className="sr-only" tabIndex={-1}>
        Atlas of Nichalas Barnes' work
      </h1>
      {legacy ? (
        <AtlasCanvas domains={domains} fiction={fiction} essays={essays} changelog={changelog} />
      ) : (
        <CosmosAtlas model={model} />
      )}
    </div>
  )
}

export const query = graphql`
  query AtlasData {
    allProject {
      nodes {
        name
        description
        link
        cta
        secondaryLink
        secondaryCta
        github
        imgSrc
        techArray
        ref
        cluster
        status
        medium
        tech
        disabled
      }
    }
    allWriting {
      nodes {
        title
        content
      }
    }
    allMarkdownRemark(
      filter: { fields: { sourceInstanceName: { eq: "changelog" } } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        frontmatter {
          title
          date
          type
          status
          project
          link
          media
        }
        excerpt(pruneLength: 200)
      }
    }
  }
`

export default AtlasPage
