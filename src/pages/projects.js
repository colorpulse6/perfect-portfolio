import React, { useState, useEffect, useRef, createRef } from "react"
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
  // const itemsRef = useRef([])
  // const [projectRefs, setProjectRefs] = useState({})

  const inputRef = useRef([])
  const handler = idx => e => {
    const next = inputRef.current[idx + 1]
    if (next) {
      next.focus()
    }
  }

  //THIS IS RUN THE FIRST TIME THE SITE IS OPENED
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
  useEffect(() => {
    gsap.to(".projects", {
      autoAlpha: 1,
      duration: 1,
    })
  }, [])

  // const refs = useRef(data.allProject.nodes.map(() => createRef()))

  // useEffect(() => {
  //   console.log(refs)
  // }, [refs])

  // useEffect(() => {
  //   setProjectRefs(refs)
  // }, [refs])

  // useEffect(() => {
  //   console.log(projectRefs)
  // }, [projectRefs])

  // useEffect(() => {
  //   itemsRef.current = itemsRef.current.slice(0, data.allProject.nodes.length)
  // }, [data.allProject])

  // const scrollToDiv = ref => window.scrollTo(0, ref.offsetTop)
  const scrollToDiv = ref => console.log(ref)

  return (
    <div
      style={{ opacity: 0, position: "relative", overflow: "scroll" }}
      className="projects"
    >
      <SEO title="Projects" />
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
              onChange={handler(i)}
              key={i}
              scrollToDiv={scrollToDiv}
              firestore={project.name === "Fire Store"}
            />
          )
        })}
    </div>
  )
}

export default Projects
