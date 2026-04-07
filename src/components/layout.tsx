/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import React, { useMemo } from "react"
import { useStaticQuery, graphql } from "gatsby"
import { motion, useMotionValue, useSpring } from "framer-motion"
import Header from "./header"
import SideBar from "../components/SideBar"
import SideBarCollapsed from "../components/SideBarCollapsed"
import ParticleBackground from "./nebula/ParticleBackground"
import TerminalConsole from "./nebula/TerminalConsole"
import { resolveTheme } from "./nebula/particleThemes"
import "./layout.css"

// Type for the GraphQL query result
interface SiteMetadataQuery {
  site: {
    siteMetadata: {
      title: string
      siteURL: string
      menuLinks: Array<{
        name: string
        link: string
      }>
    }
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

// Define the props interface for the Layout component
interface LayoutProps {
  /** Child elements to be rendered in the layout */
  children: React.ReactNode
  /** Transition status from gatsby-plugin-transition-link */
  transitionStatus?: any
  /** Location object from Gatsby router */
  location?: GatsbyLocation
}

const Layout: React.FC<LayoutProps> = ({
  children,
  transitionStatus,
  location,
}) => {
  const data: SiteMetadataQuery = useStaticQuery(graphql`
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

  const [navOpen, setNavOpen] = React.useState<boolean>(false)
  const [isTouch, setIsTouch] = React.useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springConfig = { damping: 25, stiffness: 700 }
  const trailConfig = { damping: 40, stiffness: 200 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)
  const trailXSpring = useSpring(cursorX, trailConfig)
  const trailYSpring = useSpring(cursorY, trailConfig)

  const cursorTheme = useMemo(() => {
    const theme = resolveTheme(location?.pathname || "/")
    const c = theme.colors[0]
    return `rgba(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)}, 0.9)`
  }, [location?.pathname])

  React.useEffect(() => {
    setNavOpen(false)

    if (typeof window !== "undefined") {
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
      setIsTouch(hasTouch)
      if (!hasTouch && window.innerWidth > 550) {
        document.body.classList.add("custom-cursor")
      }
    }

    const moveCursor = (e: MouseEvent): void => {
      cursorX.set(e.clientX - 7)
      cursorY.set(e.clientY - 7)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", moveCursor)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", moveCursor)
        document.body.classList.remove("custom-cursor")
      }
    }
  }, [cursorX, cursorY])

  const pagePath = location?.pathname || "/"

  return (
    <div className="layout-container">
      <ParticleBackground pagePath={pagePath} />
      {!isTouch && (
        <>
          <motion.div
            className="cursor-trail"
            style={{
              translateX: trailXSpring,
              translateY: trailYSpring,
              background: `radial-gradient(circle, ${cursorTheme} 0%, transparent 70%)`,
            }}
          />
          <motion.div
            className="cursor-dot"
            style={{
              translateX: cursorXSpring,
              translateY: cursorYSpring,
              background: cursorTheme,
            }}
          />
        </>
      )}
      <Header
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        siteTitle={data.site.siteMetadata.title || "Title"}
      />

      <SideBar
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        transitionStatus={transitionStatus}
        key="sidebar"
      />

      <div
        style={{
          margin: "0 auto",
          padding: "0 1.0875rem 1.45rem",
        }}
      >
        <main>{children}</main>
        <footer className="site-footer">
          &copy; Nichalas Barnes {new Date().getFullYear()}
        </footer>
      </div>
      {pagePath !== "/writing/" && pagePath !== "/writing" && (
        <TerminalConsole pagePath={pagePath} />
      )}
    </div>
  )
}

export default Layout
