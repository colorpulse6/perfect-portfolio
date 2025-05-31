import React, { useEffect, useRef } from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import Project from "../components/Project"
import { getImages } from "../helpers/techImages"
import { useStaticQuery, graphql } from "gatsby"
import SideBarCollapsed from "../components/SideBarCollapsed"

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
    }>
  }
}

// Type for location object from Gatsby
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
        }
      }
    }
  `)

  const inputRef = useRef<Array<HTMLElement | null>>([])

  const handler = (idx: number) => (e: React.ChangeEvent) => {
    const next = inputRef.current[idx + 1]
    if (next) {
      next.focus()
    }
  }

  // Handle page transition animations
  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".projects", {
        autoAlpha: 1,
        duration: 1, // if we are entering the page, make the div visible in one second
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".projects", {
        autoAlpha: 0,
        duration: 0.3,
      }) // if we are exiting the page, make the div transparent
    }
  }, [transitionStatus])

  // Initial page load animation
  useEffect(() => {
    gsap.to(".projects", {
      autoAlpha: 1,
      duration: 1,
    })
  }, [])

  const scrollToDiv = (ref: string): void => {
    console.log(ref)
  }

  return (
    <>
      <SideBarCollapsed
        currentWindow={location.pathname}
        transitionStatus={transitionStatus}
        menuLinks={[]}
      />
      <div style={{ opacity: 0, position: "relative" }} className="projects">
        <SEO title="Projects" />
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
                github={project.github}
                // ref={el => (inputRef.current[i] = el)}
                // onChange={handler(i)}
                key={project.id}
                scrollToDiv={() => scrollToDiv(project.ref)}
                firestore={project.name === "Fire Store"}
              />
            )
          })}
      </div>
    </>
  )
}

export default Projects
