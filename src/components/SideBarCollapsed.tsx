import React, { useState } from "react"
import TransitionLink from "gatsby-plugin-transition-link"
import Spring from "../components/Spring"
import "./sidebar.css"
import { IconType } from "react-icons"
import { AiOutlineHome } from "react-icons/ai"
import { GoProjectRoadmap } from "react-icons/go"
import { BsPersonVcard } from "react-icons/bs"
import { HiOutlineMail } from "react-icons/hi"
import { VscHistory } from "react-icons/vsc"

interface NavItem {
  name: string
  icon: IconType
}

interface SideBarCollapsedProps {
  currentWindow: string
  transitionStatus?: string
  menuLinks?: unknown[]
}

interface HoverState {
  hover: boolean
  index: NavItem | null
}

const SideBarCollapsed: React.FC<SideBarCollapsedProps> = ({ currentWindow }) => {
  const items: NavItem[] = [
    { name: "Home", icon: AiOutlineHome },
    { name: "Projects", icon: GoProjectRoadmap },
    { name: "Changelog", icon: VscHistory },
    { name: "About", icon: BsPersonVcard },
    { name: "Contact", icon: HiOutlineMail },
  ]

  const [isHover, setIsHover] = useState<HoverState>({
    hover: false,
    index: null,
  })

  const isHome = currentWindow === "/"

  return (
    <div className="sidebar-collapsed flex">
      <div>
        {items.map(item => {
          const isCurrent =
            `/${item.name.toLowerCase()}` === currentWindow.replace(/\/$/, "") ||
            (item.name === "Home" && isHome)
          return (
            <div className="sidebar-collapsed__item " key={item.name}>
              <Spring>
                <TransitionLink
                  onMouseEnter={() => {
                    setIsHover({ hover: true, index: item })
                  }}
                  onMouseLeave={() => setIsHover({ hover: false, index: null })}
                  to={item.name != "Home" ? `/${item.name.toLowerCase()}` : "/"}
                >
                  <item.icon
                    style={{
                      opacity: isCurrent ? "1" : "0.2",
                      fontSize: "32px",
                      color: "white",
                      marginLeft: isCurrent ? "35px" : "25px",
                      marginTop: "-40px",
                      filter:
                        (isHover.hover && isHover.index?.name == item.name) ||
                        isCurrent
                          ? "drop-shadow(0 0 8px white)"
                          : "",
                    }}
                  />
                </TransitionLink>
              </Spring>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SideBarCollapsed
