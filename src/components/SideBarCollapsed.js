import React from "react"
import TransitionLink from "gatsby-plugin-transition-link"
import Spring from "../components/Spring"
import "./sidebar.css"
import HomeIcon from "../images/home-icon.png"
import ProjectsIcon from "../images/suitcase-icon.png"
import AboutIcon from "../images/about-icon.png"
import ContactIcon from "../images/letter-icon.png"

export default ({ currentWindow }) => {
  const items = [
    { name: "Home", icon: HomeIcon },
    { name: "Projects", icon: ProjectsIcon },
    { name: "About", icon: AboutIcon },
    { name: "Contact", icon: ContactIcon },
  ]
  const normalizedPath =
    currentWindow && currentWindow !== "/"
      ? currentWindow.replace(/\/$/, "")
      : "/"

  return (
    <nav className="sidebar-collapsed" aria-label="Section shortcuts">
      <ul className="sidebar-collapsed__list">
        {items.map(item => {
          const targetPath =
            item.name === "Home"
              ? "/"
              : `/${item.name.toLowerCase()}`.replace(/\/$/, "")
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
            ? "sidebar-collapsed__link sidebar-collapsed__link--active"
            : "sidebar-collapsed__link"

          return (
            <li className="sidebar-collapsed__item" key={item.name}>
              <Spring>
                <TransitionLink className={linkClassName} to={targetPath}>
                  <span className="sr-only">{item.name}</span>
                  <span className="sidebar-collapsed__icon-wrap">
                    <img
                      className="icons sidebar-collapsed__icon"
                      src={item.icon}
                      alt=""
                      aria-hidden="true"
                    />
                  </span>
                </TransitionLink>
              </Spring>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
