import React, { useRef, useEffect, useState } from "react"
import { useTransition, useChain, animated, config } from "react-spring"
import TransitionLink from "gatsby-plugin-transition-link"
import Spring from "../components/Spring"
import Link from "gatsby"
import "./sidebar.css"
import HomeIcon from "../images/home-icon.png"
import ProjectsIcon from "../images/suitcase-icon.png"
import AboutIcon from "../images/about-icon.png"
import ContactIcon from "../images/letter-icon.png"
import { useStaticQuery, graphql } from "gatsby"

export default ({
  homeURL,
  transitionStatus,
  menuLinks,
  // onAnimationStart,
  // onAnimationEnd
}) => {
  const [isHomePage, setisHomePage] = useState(false)

  React.useEffect(() => {
    console.log(menuLinks)
  }, [])

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
    { name: "Home", icon: HomeIcon },
    { name: "Projects", icon: ProjectsIcon },
    { name: "About", icon: AboutIcon },
    { name: "Contact", icon: ContactIcon },
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
  React.useEffect(() => {
    console.log(isHover)
  }, [isHover])

  // const isWindow = item => {
  //   if(window.location.pathname === `/${String(item.name).toLowerCase()}`) {
  //     return tr
  //   }

  // }

  return (
    <div className="sidebar-collapsed flex">
      <div>
        {items
          ? items.map((item, index) => (
              <div className="sidebar-collapsed__item" key={item.name}>
                <Spring>
                  <TransitionLink
                    onMouseEnter={() =>
                      setIsHover({ hover: true, index: item })
                    }
                    onMouseLeave={() => setIsHover(false)}
                    to={
                      item && item.name != "Home"
                        ? `/${item.name.toLowerCase()}`
                        : "/"
                    }
                  >
                    <img
                      style={{
                        opacity: "100%",
                        width: "40px",
                        backgroundImage:
                          isHover.hover && isHover.index.name == item.name
                            ? "url(https://media.giphy.com/media/CvWb8F42SAfGo/giphy.gif)"
                            : "",

                        marginLeft: "25px",

                        marginTop: "-40px",
                      }}
                      className="icons"
                      src={item.icon}
                    />
                  </TransitionLink>
                </Spring>
              </div>
            ))
          : null}
      </div>
      <p className="second-title"> Fuck yall! </p>
    </div>
  )
}
