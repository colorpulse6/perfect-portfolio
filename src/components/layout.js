/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"
import { motion, useMotionValue, useSpring } from "framer-motion"
import gsap from "gsap"

import Header from "./header"
import SideBar from "../components/SideBar"
import SideBarCollapsed from "../components/SideBarCollapsed"
import Slide from "react-reveal/Slide"

import "./layout.css"

const Layout = ({ children, transitionStatus, location }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
          siteURL
          menuLinks {
            name
            link
          }
        }
      }
    }
  `)
  const [isHome, setIsHome] = React.useState(false)
  const [navOpen, setNavOpen] = React.useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  React.useEffect(() => {
    setNavOpen(false)
    const moveCursor = e => {
      cursorX.set(e.clientX - 16)
      cursorY.set(e.clientY - 16)
    }

    window.addEventListener("mousemove", moveCursor)

    return () => {
      window.removeEventListener("mousemove", moveCursor)
    }
  }, [])

  React.useEffect(() => {
    if (data.site.siteMetadata.siteURL === "http://localhost:8000/") {
      setIsHome(true)
    }
  }, [data])

  return (
    <>
      <motion.div
        id="cursor"
        className="cursor"
        style={{
          translateX: cursorXSpring,
          translateY: cursorYSpring,
        }}
      />
      <Header
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        siteTitle={data.site.siteMetadata.title || `Title`}
      />

      <div>
        <Slide left>
          <SideBarCollapsed
            navOpen={navOpen}
            setNavOpen={setNavOpen}
            homeURL={data.site.siteMetadata.siteURL}
            menuLinks={data.site.siteMetadata.menuLinks}
          />
        </Slide>
      </div>

      <SideBar
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        key="sidebar"
      ></SideBar>

      <div
        style={{
          margin: `0 auto`,
          // maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
        }}
      >
        <main>{children}</main>
        <footer
          style={{
            color: "white",
            position: "fixed",
            bottom: 5,
          }}
        >
          © {new Date().getFullYear()}, Built with
          {` `}
          <a href="https://www.gatsbyjs.com">Gatsby</a>
        </footer>
      </div>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
