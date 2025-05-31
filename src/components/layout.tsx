/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import { motion, useMotionValue, useSpring } from "framer-motion"
import gsap from "gsap"

import Header from "./header"
import SideBar from "../components/SideBar"
import SideBarCollapsed from "../components/SideBarCollapsed"

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

/**
 * Layout component that provides the main site structure and navigation
 * @param props - The component props
 * @returns JSX element for the site layout
 */
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
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  React.useEffect(() => {
    setNavOpen(false)

    const moveCursor = (e: MouseEvent): void => {
      cursorX.set(e.clientX - 16)
      cursorY.set(e.clientY - 16)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", moveCursor)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", moveCursor)
      }
    }
  }, [cursorX, cursorY])

  return (
    <div className="layout-container">
      {/* <p>Path is {location?.pathname}</p> */}
      {/* <motion.div
        id="cursor"
        className="cursor"
        style={{
          translateX: cursorXSpring,
          translateY: cursorYSpring,
        }}
      /> */}
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
          // maxWidth: 960,
          padding: "0 1.0875rem 1.45rem",
        }}
      >
        <main>{children}</main>
        <footer
          style={{
            color: "white",
            marginTop: "150px",
            bottom: 5,
          }}
        >
          © {new Date().getFullYear()}, Built with{" "}
          <a href="https://www.gatsbyjs.com">Gatsby</a>
        </footer>
      </div>
    </div>
  )
}

export default Layout
