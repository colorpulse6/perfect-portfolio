import React from "react"
import { graphql } from "gatsby"
import gsap from "gsap"
import SEO from "../components/seo"
import HomeScene from "../components/nebula/HomeScene"
import { FeaturedEntry } from "../components/nebula/DomArtifacts"
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
    .map((n) => ({
      title: n.frontmatter.title,
      date: n.frontmatter.date,
      type: n.frontmatter.type as FeaturedEntry["type"],
      link: n.frontmatter.link,
      status: n.frontmatter.status,
      project: n.frontmatter.project,
      excerpt: n.excerpt,
      featured: true,
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
        </div>
      </div>
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
        }
        excerpt(pruneLength: 160)
      }
    }
  }
`

export default IndexPage
