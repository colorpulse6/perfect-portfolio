import React from "react"
import SEO from "../components/seo"
import gsap from "gsap"

const Contact = ({ transitionStatus }) => {
  React.useEffect(() => {
    gsap.to(".contact", {
      autoAlpha: 1,
      duration: 1,
    })
  }, []) //THIS IS RUN THE FIRST TIME THE SITE IS OPENED
  React.useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".contact", {
        autoAlpha: 1,
        duration: 1, //if we are entering the page, let's make the div with class .hometex visible in one second
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".contact", { autoAlpha: 0, duration: 0.3 }) //if we are exiting  the page, let's make the div with class .hometex transparent in one second
    }
  }, [transitionStatus])
  return (
    <div className="contact">
      <SEO title="Contact" />
      <p style={{ color: "white" }}>Contact</p>
    </div>
  )
}

export default Contact
