import React, { useRef, useEffect, useState } from "react"
import { useTransition, useChain, animated, config } from "react-spring"
import TransitionLink from "gatsby-plugin-transition-link"
import Spring from "../components/Spring"
import "./sidebar.css"
import { AiOutlineHome } from "react-icons/ai"
import { GoProjectRoadmap } from "react-icons/go"
import { BsPersonVcard } from "react-icons/bs"
import { HiOutlineMail } from "react-icons/hi"
import { VscHistory } from "react-icons/vsc"

export default ({
  currentWindow,
  transitionStatus,
  menuLinks,
  // onAnimationStart,
  // onAnimationEnd
}) => {
  // const sidebarRef = useRef()
  // const transition = useTransition(navOpen, null, {
  //   from: {
  //     transform: "translateX(100vw)",
  //   },
  //   enter: {
  //     transform: "translateX(35vw)",
  //   },
  //   leave: {
  //     transform: "translateY(-10vw)",
  //   },
  //   unique: true,
  //   config: config.stiff,
  //   ref: sidebarRef,
  //   // onStart: onAnimationStart,
  //   // onRest: onAnimationEnd
  // })

  const items = [
    { name: "Home", icon: AiOutlineHome },
    { name: "Projects", icon: GoProjectRoadmap },
    { name: "Changelog", icon: VscHistory },
    { name: "About", icon: BsPersonVcard },
    { name: "Contact", icon: HiOutlineMail },
  ]
  // const itemsRef = useRef()
  // const trail = useTransition(navOpen ? items : [], item => item, {
  //   from: {
  //     opacity: 0,
  //     transform: "translateY(50px)",
  //   },
  //   enter: {
  //     opacity: 1,
  //     transform: "translateY(0)",
  //   },
  //   leave: {
  //     opacity: 0,
  //     transform: "translateY(-25px)",
  //   },
  //   ref: itemsRef,
  //   config: config.wobbly,
  //   trail: 100,
  //   unique: true,
  // })

  // useChain([sidebarRef, itemsRef], [0, 0.25])

  const [isHover, setIsHover] = useState({ hover: false, index: null })



  const isHome = currentWindow === "/"

  return (
    <div className="sidebar-collapsed flex">
      <div>
        {items
          ? items.map(item => (
              <div className="sidebar-collapsed__item " key={item.name}>
                <Spring>
                  <TransitionLink
                    onMouseEnter={() => {
                      setIsHover({ hover: true, index: item })
                    }}
                    onMouseLeave={() => setIsHover(false)}
                    to={
                      item && item.name != "Home"
                        ? `/${item.name.toLowerCase()}`
                        : "/"
                    }
                  >
                    <item.icon
                      style={{
                        opacity:
                          `/${item.name.toLowerCase()}` === currentWindow.replace(/\/$/, "") ||
                          (item.name === "Home" && isHome)
                            ? "1"
                            : "0.2",
                        fontSize: "32px",
                        color: "white",
                        marginLeft:
                          `/${item.name.toLowerCase()}` === currentWindow.replace(/\/$/, "") ||
                          (item.name === "Home" && isHome)
                            ? "35px"
                            : "25px",
                        marginTop: "-40px",
                        filter:
                          (isHover.hover && isHover.index.name == item.name) ||
                          `/${item.name.toLowerCase()}` === currentWindow.replace(/\/$/, "") ||
                          (item.name === "Home" && isHome)
                            ? "drop-shadow(0 0 8px white)"
                            : "",
                      }}
                    />
                  </TransitionLink>
                </Spring>
              </div>
            ))
          : null}
      </div>
    </div>
  )
}
