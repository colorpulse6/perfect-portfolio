import React, { useMemo } from "react"
import { graphql } from "gatsby"
import SEO from "../components/seo"
import AtlasCanvas from "../components/atlas/AtlasCanvas"
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
  usePageTransition(transitionStatus, ".atlas-page", { enter: 1, exit: 0.4, mount: 1 })

  const { domains, fiction, essays, changelog } = useMemo(
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

  return (
    <div className="atlas-page" style={{ opacity: 0 }}>
      <SEO title="Atlas" description="A 3D galaxy-map of Nichalas Barnes' work. Drag to rotate, dive into a cluster, and explore projects, essays, and fiction." pathname={location?.pathname} />
      <AtlasCanvas domains={domains} fiction={fiction} essays={essays} changelog={changelog} />
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
