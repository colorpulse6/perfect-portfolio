import React, { useRef } from "react"
import { useTransition, useChain, animated, config } from "react-spring"
import TransitionLink from "gatsby-plugin-transition-link"
import Spring from "../components/Spring"

import "./sidebar.css"

const NAV_ITEMS = ["Home", "Projects", "About", "Contact"]
const NAVIGATION_ID = "site-navigation"

export default ({
  navOpen,
  setNavOpen,
  transitionStatus,
  currentPath = "",
  // onAnimationStart,
  // onAnimationEnd
}) => {
  const sidebarRef = useRef()
  const sidebarTransition = useTransition(navOpen, null, {
    from: {
      transform: "translateX(100%)",
    },
    enter: {
      transform: "translateX(0%)",
    },
    leave: {
      transform: "translateX(100%)",
    },
    unique: true,
    config: config.stiff,
    ref: sidebarRef,
    // onStart: onAnimationStart,
    // onRest: onAnimationEnd
  })

  const itemsRef = useRef()
  const trail = useTransition(navOpen ? NAV_ITEMS : [], item => item, {
    from: {
      opacity: 0,
      transform: "translateY(32px)",
    },
    enter: {
      opacity: 1,
      transform: "translateY(0px)",
    },
    leave: {
      opacity: 0,
      transform: "translateY(-24px)",
    },
    ref: itemsRef,
    config: config.wobbly,
    trail: 120,
    unique: true,
  })

  useChain(
    navOpen ? [sidebarRef, itemsRef] : [itemsRef, sidebarRef],
    navOpen ? [0, 0.2] : [0, 0.4]
  )

  const normalizedPath =
    (currentPath && currentPath !== "/"
      ? currentPath.replace(/\/$/, "")
      : "/") || "/"

  return sidebarTransition.map(({ item, key, props }) =>
    item ? (
      <animated.nav
        key={key}
        id={NAVIGATION_ID}
        aria-label="Primary"
        aria-hidden={!navOpen}
        style={props}
        className="sidebar"
      >
        <div className="sidebar__list">
          {trail.map(({ item: navItem, key: itemKey, props: itemProps }) => {
            const targetPath =
              navItem === "Home"
                ? "/"
                : `/${navItem.toLowerCase()}`.replace(/\/$/, "")
            const sanitizedCurrent =
              normalizedPath === "/"
                ? "/"
                : normalizedPath.replace(/\/$/, "")
            const sanitizedTarget =
              targetPath === "/"
                ? "/"
                : targetPath.replace(/\/$/, "")
            const isActive =
              sanitizedTarget === "/"
                ? sanitizedCurrent === "/"
                : sanitizedCurrent.startsWith(sanitizedTarget)

            const linkClassName = isActive
              ? "sidebar__link sidebar__link--active"
              : "sidebar__link"
            const linkTextClassName = isActive
              ? "sidebar__link-text sidebar__link-text--active"
              : "sidebar__link-text"

            return (
              <animated.div
                key={itemKey || navItem}
                style={itemProps}
                className="sidebar__item"
              >
                <Spring>
                  <TransitionLink
                    className={linkClassName}
                    onClick={() => {
                      setNavOpen(!navOpen)
                    }}
                    exit={{
                      length: 1,
                    }}
                    entry={{ length: 1 }}
                    to={navItem !== "Home" ? targetPath : "/"}
                  >
                    <span className={linkTextClassName}>{navItem}</span>
                  </TransitionLink>
                </Spring>
              </animated.div>
            )
          })}
        </div>
      </animated.nav>
    ) : null
  )
}
