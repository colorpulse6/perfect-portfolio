import React, { useRef, useState } from "react"
import { useTransition, useChain, animated as animatedWeb, config } from "react-spring"
import TransitionLink from "gatsby-plugin-transition-link"
import Spring from "../components/Spring"

import "./sidebar.css"

// react-spring v8's `animated` host-element types collide with the three.js
// variant present in this project (via @react-three/fiber); the web runtime is
// correct, so type the helper loosely.
const animated: any = animatedWeb

interface SideBarProps {
  navOpen: boolean
  setNavOpen: (open: boolean) => void
  transitionStatus?: string
}

interface HoverState {
  hover: boolean
  index: string | null
}

const SideBar: React.FC<SideBarProps> = ({ navOpen, setNavOpen }) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768

  const sidebarRef = useRef<any>(null)
  const transition = useTransition(navOpen, null, {
    from: {
      transform: "translateX(100vw)",
    },
    enter: {
      transform: isMobile ? "translateX(0vw)" : "translateX(35vw)",
    },
    leave: {
      transform: "translateY(-100vw)",
    },
    unique: true,
    config: config.stiff,
    ref: sidebarRef,
  })

  const items = ["Home", "Projects", "Changelog", "About", "Contact"]
  const itemsRef = useRef<any>(null)
  const trail = useTransition(navOpen ? items : [], item => item, {
    from: {
      opacity: 0,
      transform: "translateY(50px)",
    },
    enter: {
      opacity: 1,
      transform: "translateY(0)",
    },
    leave: {
      opacity: 0,
      transform: "translateY(-25px)",
    },
    ref: itemsRef,
    config: config.wobbly,
    trail: 100,
    unique: true,
  })

  useChain(
    navOpen ? [sidebarRef, itemsRef] : [itemsRef, sidebarRef],
    navOpen ? [0, 0.25] : [0, 0.6]
  )

  const [, setIsHover] = useState<HoverState>({ hover: false, index: null })

  return transition.map(({ item, key, props }) =>
    item ? (
      <animated.div key={key} style={props} className="sidebar">
        {trail.map(({ item, key, props }) => (
          <animated.div key={item} style={props} className="sidebar__item">
            <Spring>
              <TransitionLink
                onMouseEnter={() => setIsHover({ hover: true, index: item })}
                onMouseLeave={() => setIsHover({ hover: false, index: null })}
                onClick={() => {
                  setNavOpen(!navOpen)
                }}
                style={{
                  textShadow:
                    window.location.pathname === `/${item.toLowerCase()}` ||
                    (window.location.pathname === "/" && item === "Home")
                      ? "0 0 35px white"
                      : "",
                }}
                exit={{
                  length: 1,
                }}
                entry={{ length: 1 }}
                to={item != "Home" ? `/${item.toLowerCase()}` : "/"}
              >
                {item}
              </TransitionLink>
            </Spring>
          </animated.div>
        ))}
      </animated.div>
    ) : null
  )
}

export default SideBar
