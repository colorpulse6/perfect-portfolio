import React, { useState, useEffect, useRef } from "react"
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

  const [refArray, setRefArray] = useState([])
  const [addBG, setAddBG] = useState(false)
  const detectScroll = () => {
    // console.log(window.pageYOffset)

    if (window.pageYOffset >= 599) {
      setAddBG(true)
    } else if (window.pageYOffset <= 600) {
      setAddBG(false)
    }
  }

  const scrollToHoopItAppRef = ref => window.scrollTo(0, ref.current.offsetTop)
  const scrollToFireStoreRef = ref => window.scrollTo(0, ref.current.offsetTop)
  const scrollToGigzillaRef = ref => window.scrollTo(0, ref.current.offsetTop)
  const scrollToMadScienceRef = ref => window.scrollTo(0, ref.current.offsetTop)
  const scrollToTop = () => window.scrollTo(window)

  useEffect(() => {
    scrollToTop()
    window.addEventListener("scroll", detectScroll)
  }, [])

  useEffect(() => {
    data.allProject.nodes.map(project => {
      setRefArray(refArray => [...refArray, project.ref])
    })
  }, [data])

  useEffect(() => {}, [refArray])

  const jobToastRef = useRef(null)
  const hoopItAppRef = useRef(null)
  const fireStoreRef = useRef(null)
  const gigzillaRef = useRef(null)
  const madScienceRef = useRef(null)

  const useRefArray = {jobToastRef, hoopItAppRef, fireStoreRef, gigzillaRef, madScienceRef }

  const executeScrolljobToastRef = () => scrollTojobToastRef(jobToastRef)
  const executeScrollhoopItAppRef = () => scrollToHoopItAppRef(hoopItAppRef)
  const executeScrollfireStoreRef = () => scrollToFireStoreRef(fireStoreRef)
  const executeScrollgigzillaRef = () => scrollToGigzillaRef(gigzillaRef)
  const executeScrollmadScienceRef = () => scrollToMadScienceRef(madScienceRef)

  const executeScrollTop = () => scrollToTop(window)
  // useEffect(() => {
  //   refArray.filter(element => {
  //     for (var key in useRefArray) {
  //       if (String(key) === element) console.log(element)
  //     }
  //   })
  // }, [refArray])
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
          <div key={index} style={{ marginTop: "80px" }}>
            <Project
              image={project.imgSrc}
              description={project.description}
              name={project.name}
              techArray={getImages(project.techArray)}
              index={index}
              link={project.link}
              github={project.github}
              refString={project.ref}
                executeScroll={refArray.filter(element => {
                for (var key in useRefArray) {
                  if (String(key) === element) return "executeScroll"+key}
              })}

            />
          </div>
        )
      })}
    </div>
  )
}

export default Projects
