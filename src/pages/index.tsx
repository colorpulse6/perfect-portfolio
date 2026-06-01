import React from "react"
import { graphql } from "gatsby"
import gsap from "gsap"
import SEO from "../components/seo"
import HomeScene from "../components/nebula/HomeScene"
import { FeaturedEntry } from "../components/nebula/DomArtifacts"
import AtlasDive from "../components/atlas/AtlasDive"
import "./index.css"

interface GatsbyLocation {
  pathname: string
  search?: string
  hash?: string
  href?: string
  origin?: string
  protocol?: string
  host?: string
  hostname?: string
  port?: string
  state?: any
  key?: string
}

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

const IndexPage: React.FC<IndexPageProps> = ({
  transitionStatus,
  location,
  data,
}) => {
  const [diving, setDiving] = React.useState(false)

  // Hyperspace dive into /atlas: fade the title, play the warp overlay, navigate.
  const diveToAtlas = (e: React.MouseEvent) => {
    e.preventDefault()
    if (diving) return
    setDiving(true)
    gsap.to(".hometex", { autoAlpha: 0, duration: 0.5 })
  }

  React.useEffect(() => {
    gsap.to(".hometex", {
      autoAlpha: 1,
      duration: 1,
    })
  }, [])

  React.useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".hometex", {
        autoAlpha: 1,
        duration: 3.5,
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".hometex", {
        autoAlpha: 0,
        duration: 1,
      })
    }
  }, [transitionStatus])

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
    }))

  return (
    <div className="home-root">
      <HomeScene featuredEntries={featuredEntries} />
      <div
        style={{ opacity: 0, position: "relative", zIndex: 2 }}
        className="hometex"
      >
        <SEO title="Home" />
        <div className="title">
          <h1 className="glitch-text" data-text="Welcome to Nichalas Barnes">
            Welcome to Nichalas Barnes
          </h1>
          <div className="atlas-cta">
            <button className="atlas-enter" onClick={diveToAtlas}>
              <span>Explore the Atlas</span>
              <span className="atlas-arrow">↗</span>
            </button>
            <div className="atlas-hint">A LIVING MAP OF EVERY MEDIUM · NEW</div>
          </div>
        </div>
      </div>
      {diving && <AtlasDive />}
      <style>{`
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
        }
        excerpt(pruneLength: 160)
      }
    }
  }
`

export default IndexPage
