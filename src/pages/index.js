import * as React from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import gsap from "gsap"

import Layout from "../components/layout"
import SEO from "../components/seo"
import "./index.css"
const IndexPage = ({ transitionStatus }) => {
  React.useEffect(() => {
    gsap.to(".hometex", {
      autoAlpha: 1,
      duration: 1,
    })
  }, []) //THIS IS RUN THE FIRST TIME THE SITE IS OPENED
  React.useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".hometex", {
        autoAlpha: 1,
        duration: 3.5, //if we are entering the page, let's make the div with class .hometex visible in one second
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".hometex", { autoAlpha: 0, duration: 1 }) //if we are exiting  the page, let's make the div with class .hometex transparent in one second
    }
  }, [transitionStatus])
  return (
    <div style={{ opacity: 0 }} className="hometex">
      <SEO title="Home" />
      <div className="title">
        <h1>
          fullstack
          <br />
          developer
        </h1>
      </div>
    </div>
  )
}

export default IndexPage
