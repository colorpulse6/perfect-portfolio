import React from "react"
import gsap from "gsap"
import SEO from "../components/seo"
import "./index.css"

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

// Define the props interface for the Index page
interface IndexPageProps {
  /** Transition status from gatsby-plugin-transition-link */
  transitionStatus?: string
  /** Location object from Gatsby router */
  location?: GatsbyLocation
}

/**
 * Index page component (home page) with animated title
 * @param props - The component props
 * @returns JSX element for the home page
 */
const IndexPage: React.FC<IndexPageProps> = ({
  transitionStatus,
  location,
}) => {
  // Initial page load animation
  React.useEffect(() => {
    gsap.to(".hometex", {
      autoAlpha: 1,
      duration: 1,
    })
  }, []) // THIS IS RUN THE FIRST TIME THE SITE IS OPENED

  // Handle page transition animations
  React.useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".hometex", {
        autoAlpha: 1,
        duration: 3.5, // if we are entering the page, make the div visible
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".hometex", {
        autoAlpha: 0,
        duration: 1,
      }) // if we are exiting the page, make the div transparent
    }
  }, [transitionStatus])

  return (
    <div>
      {/* <Slide left>
        <SideBarCollapsed currentWindow={location?.pathname} />
      </Slide> */}
      <div style={{ opacity: 0 }} className="hometex">
        <SEO title="Home" />
        <div className="title">
          <h1 className="background-video">
            fullstack
            <br />
            developer
          </h1>
        </div>
      </div>
    </div>
  )
}

export default IndexPage
