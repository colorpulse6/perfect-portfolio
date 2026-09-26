import React from "react"
import { graphql, navigate, prefetchPathname } from "gatsby"
import gsap from "gsap"
import SEO from "../components/seo"
import HomeScene from "../components/nebula/HomeScene"
import { FeaturedEntry } from "../components/nebula/DomArtifacts"
import { getStage } from "../components/cosmos/cosmos"
import { getCosmos } from "../components/cosmos/cosmosStore"
import { snapshotHome } from "../components/cosmos/homeSnapshot"
import { GatsbyLocation } from "../types/gatsby"
import { usePageTransition } from "../helpers/usePageTransition"
import "./index.css"

interface MarkdownNode {
  frontmatter: {
    title: string
    date: string
    type: string
    link: string | null
    status: string | null
    project: string | null
    featured: boolean | null
    media: string | null
    cta: string | null
    secondaryLink: string | null
    secondaryCta: string | null
  }
  excerpt: string
}

interface IndexPageProps {
  transitionStatus?: string
  location?: GatsbyLocation
  data: {
    allMarkdownRemark: {
      nodes: MarkdownNode[]
    }
  }
}

/** sessionStorage count of wormhole journeys; repeats play faster. */
const JOURNEYS_KEY = "cosmos-journeys"
const REPEAT_SPEED = 1.45

const IndexPage: React.FC<IndexPageProps> = ({
  transitionStatus,
  location,
  data,
}) => {
  const launching = React.useRef(false)

  // Warm the Atlas route while the visitor reads the page.
  React.useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
      cancelIdleCallback?: (h: number) => void
    }
    const run = () => prefetchPathname("/atlas/")
    if (w.requestIdleCallback) {
      const h = w.requestIdleCallback(run, { timeout: 3000 })
      return () => w.cancelIdleCallback?.(h)
    }
    const t = window.setTimeout(run, 1500)
    return () => window.clearTimeout(t)
  }, [])

  // Into the Atlas through the wormhole: snapshot the page as it looks right
  // now, then let the stage run the journey and navigate at the hand-off.
  // Without WebGL, or with reduced motion, go there directly.
  const exploreAtlas = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (launching.current) return
    launching.current = true
    const go = () => navigate("/atlas/")
    const stage = getStage()
    const { support } = getCosmos()
    if (!stage || support === "unsupported" || support === "lost") {
      go()
      return
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.to(".hometex", { autoAlpha: 0, duration: 0.35, onComplete: go })
      return
    }
    const cta = e.currentTarget
    const r = cta.getBoundingClientRect()
    let journeys = 0
    try {
      journeys = Number(sessionStorage.getItem(JOURNEYS_KEY)) || 0
    } catch {
      // Storage may be unavailable (private mode); treat as a first visit.
    }
    try {
      performance.mark("cosmos-click")
      const snapshot = await snapshotHome({ dpr: Math.min(window.devicePixelRatio || 1, 2), cta })
      performance.measure("cosmos-snapshot", "cosmos-click")
      const started = await stage.startJourney({
        snapshot,
        ctaCenter: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
        speed: journeys > 0 ? REPEAT_SPEED : 1,
        onHandoff: () => navigate("/atlas/", { state: { viaJourney: true } }),
      })
      performance.measure("cosmos-launch", "cosmos-click")
      if (!started) {
        go()
        return
      }
      try {
        sessionStorage.setItem(JOURNEYS_KEY, String(journeys + 1))
      } catch {
        // See above.
      }
    } catch {
      go()
    }
  }

  usePageTransition(transitionStatus, ".hometex", { enter: 3.5, exit: 1, mount: 1 })

  const featuredEntries: FeaturedEntry[] = (data?.allMarkdownRemark?.nodes || [])
    .filter((n) => n.frontmatter.featured === true)
    .map((n) => ({
      title: n.frontmatter.title,
      date: n.frontmatter.date,
      type: n.frontmatter.type as FeaturedEntry["type"],
      link: n.frontmatter.link,
      status: n.frontmatter.status,
      project: n.frontmatter.project,
      excerpt: n.excerpt,
      featured: true,
      media: n.frontmatter.media,
      cta: n.frontmatter.cta,
      secondaryLink: n.frontmatter.secondaryLink,
      secondaryCta: n.frontmatter.secondaryCta,
    }))

  return (
    <div className="home-root">
      <HomeScene featuredEntries={featuredEntries} />
      <div
        style={{ opacity: 0, position: "relative", zIndex: 2 }}
        className="hometex"
        data-cosmos-snapshot="1"
      >
        <SEO title="Home" description="Software engineer and composer Nichalas Barnes. A living map of every medium: developer tools, web apps, games, Obsidian plugins, music, and writing." pathname={location?.pathname} />
        <div className="title">
          <h1 className="glitch-text" data-text="Welcome to Nichalas Barnes">
            Welcome to Nichalas Barnes
          </h1>
          <p className="home-intro">
            Software engineer and composer. Obsidian plugins, web apps, AI
            systems, and a decade of music across the US and Europe.
          </p>
          <div className="atlas-cta">
            <button className="atlas-enter" onClick={exploreAtlas}>
              <span>Explore the Atlas</span>
              <span className="atlas-arrow">↗</span>
            </button>
            <div className="atlas-hint">A LIVING MAP OF EVERY MEDIUM · NEW</div>
          </div>
        </div>
      </div>
      <style>{`
        .home-intro { max-width: 560px; margin: 16px auto 0; color: rgba(190,200,230,0.68); font-size: 14px; line-height: 1.6; font-weight: 300; }
        .atlas-cta { pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 30px; }
        .atlas-enter { display: inline-flex; align-items: center; gap: 12px; padding: 14px 28px; border: 1px solid rgba(54,230,219,0.35); border-radius: 999px; white-space: nowrap; color: rgba(238,242,255,0.92); font-family: "Courier New", "Lucida Console", monospace; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; cursor: pointer; background: rgba(54,230,219,0.04); box-shadow: 0 0 30px rgba(54,230,219,0.08); transition: all .25s; backdrop-filter: blur(4px); }
        .atlas-enter:hover { background: rgba(54,230,219,0.12); box-shadow: 0 0 50px rgba(54,230,219,0.22); transform: translateY(-2px); }
        .atlas-arrow { color: #36e6db; transition: transform .25s; }
        .atlas-enter:hover .atlas-arrow { transform: translateX(4px); }
        .atlas-hint { font-family: "Courier New", "Lucida Console", monospace; font-size: 9px; letter-spacing: 2px; color: rgba(150,165,210,0.5); }
      `}</style>
    </div>
  )
}

export const query = graphql`
  query FeaturedChangelog {
    allMarkdownRemark(
      filter: { fields: { sourceInstanceName: { eq: "changelog" } } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        frontmatter {
          title
          date
          type
          link
          status
          project
          featured
          media
          cta
          secondaryLink
          secondaryCta
        }
        excerpt(pruneLength: 160)
      }
    }
  }
`

export default IndexPage
