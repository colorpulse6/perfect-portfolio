import React, { useRef, useEffect, useState } from "react"
import { useTransition, useChain, animated, config } from "react-spring"
import TransitionLink from "gatsby-plugin-transition-link"
import Spring from "../components/Spring"

import "./sidebar.css"

export default ({
  navOpen,
  setNavOpen,
  transitionStatus,
  // onAnimationStart,
  // onAnimationEnd
}) => {
  const sidebarRef = useRef()
  const transition = useTransition(navOpen, null, {
    from: {
      transform: "translateX(100vw)",
    },
    enter: {
      transform: "translateX(35vw)",
    },
    leave: {
      transform: "translateY(-100vw)",
    },
    unique: true,
    config: config.stiff,
    ref: sidebarRef,
    // onStart: onAnimationStart,
    // onRest: onAnimationEnd
  })

  const items = ["Home", "Projects", "About", "Contact"]
  const itemsRef = useRef()
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
  useEffect(() => {
    console.log(transitionStatus)
  }, [transitionStatus])

  const [isHover, setIsHover] = useState({ hover: false, index: null })

  return transition.map(({ item, key, props }) =>
    item ? (
      <animated.div key={key} style={props} className="sidebar">
        {trail.map(({ item, key, props }) => (
          <animated.div key={item} style={props} className="sidebar__item">
            <Spring>
              <TransitionLink
                onMouseEnter={() => setIsHover({ hover: true, index: item })}
                onMouseLeave={() => setIsHover(false)}
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
