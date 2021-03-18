import React from "react"
import SEO from "../components/seo"
import gsap from "gsap"

const Projects = ({ transitionStatus }) => {
  React.useEffect(() => {
    gsap.to(".projects", {
      autoAlpha: 1,
      duration: 0.3,
    })
  }, []) //THIS IS RUN THE FIRST TIME THE SITE IS OPENED
  React.useEffect(() => {
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
    <div className="projects">
      <SEO title="Projects" />
      <p style={{ color: "white" }}>Projects</p>
    </div>
  )
}

export default Projects
