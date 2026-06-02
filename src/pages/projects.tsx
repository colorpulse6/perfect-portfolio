import React from "react"
import SEO from "../components/seo"
import Project from "../components/Project"
import { getImages } from "../helpers/techImages"
import { useStaticQuery, graphql } from "gatsby"
import SideBarCollapsed from "../components/SideBarCollapsed"
import { GatsbyLocation } from "../types/gatsby"
import { usePageTransition } from "../helpers/usePageTransition"
import { softwareApplication } from "../helpers/structuredData"

// Type for GraphQL query result
interface ProjectQueryData {
  allProject: {
    nodes: Array<{
      name: string
      techArray: number[]
      ref: string
      description: string
      link: string
      github?: string
      imgSrc: string
      id: string
      cluster?: string
      slug: string
    }>
  }
}

// Define the props interface for the Projects page
interface ProjectsProps {
  /** Transition status from gatsby-plugin-transition-link */
  transitionStatus?: string
  /** Location object from Gatsby router */
  location: GatsbyLocation
}

/**
 * Projects page component that displays a list of portfolio projects
 * @param props - The component props
 * @returns JSX element for the projects page
 */
const Projects: React.FC<ProjectsProps> = ({ transitionStatus, location }) => {
  const data: ProjectQueryData = useStaticQuery(graphql`
    query MyProjectQuery {
      allProject {
        nodes {
          name
          techArray
          ref
          description
          link
          github
          imgSrc
          id
          cluster
          slug
        }
      }
    }
  `)

  usePageTransition(transitionStatus, ".projects", { enter: 1, exit: 0.3, mount: 1 })

  const projectSchema = data.allProject.nodes.map(p =>
    softwareApplication({
      name: p.name,
      description: p.description,
      link: p.link,
      github: p.github,
      cluster: p.cluster,
    })
  )

  return (
    <>
      <SideBarCollapsed
        currentWindow={location.pathname}
        transitionStatus={transitionStatus}
        menuLinks={[]}
      />
      <div style={{ opacity: 0, position: "relative" }} className="projects">
        <SEO title="Projects" description="Selected projects by Nichalas Barnes: developer tools, web apps, games, and Obsidian plugins." pathname={location?.pathname} schema={projectSchema} />
        <p className="second-title background-video">
          {location.pathname.substring(1).replace(/\/$/, "")}
        </p>
        {data &&
          data.allProject.nodes.map((project, i) => {
            return (
              <Project
                image={project.imgSrc}
                description={project.description}
                name={project.name}
                techArray={getImages(project.techArray)}
                index={i}
                link={project.link}
                slug={project.slug}
                github={project.github}
                key={project.id}
                firestore={project.name === "Fire Store"}
              />
            )
          })}
      </div>
    </>
  )
}

export default Projects
