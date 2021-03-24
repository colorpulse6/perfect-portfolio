import React, { useEffect } from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import Project from "../components/Project"
import { getImages } from "../helpers/techImages"
import { useStaticQuery, graphql } from "gatsby"

const Projects = ({ transitionStatus }) => {
  const data = useStaticQuery(graphql`
    query MyProjectQuery {
      allProject {
        nodes {
          name
          techArray
          description
          link
          imgSrc
          id
        }
      }
    }
  `)

  useEffect(() => {
    console.log(data.allProject.nodes)
  }, [data])

  //Animation
  useEffect(() => {
    gsap.to(".projects", {
      autoAlpha: 1,
      duration: 1,
    })
  }, []) //THIS IS RUN THE FIRST TIME THE SITE IS OPENED
  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".projects", {
        autoAlpha: 1,
        duration: 1, //if we are entering the page, let's make the div with class .hometex visible in one second
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".projects", { autoAlpha: 0, duration: 0.3 }) //if we are exiting  the page, let's make the div with class .hometex transparent in one second
    }
  }, [transitionStatus])
  return (
    <div style={{ opacity: 0 }} className="projects">
      <SEO title="Projects" />
      {data.allProject.nodes.map((project, index) => {
        return (
          <Project
            image={project.imgSrc}
            description={project.description}
            name={project.name}
            techArray={getImages(project.techArray)}
            index={index}
          />
        )
      })}
    </div>
  )
}

export default Projects
