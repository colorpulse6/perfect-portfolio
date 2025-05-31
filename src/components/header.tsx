import React from "react"
import { Link } from "gatsby"
import Hamburger from "./Hamburger"
import Spring from "../components/Spring"
import GithubIcon from "../images/github.png"
import LinkedinIcon from "../images/linkedin-icon.png"
import "./header.css"

// Define the props interface for the Header component
interface HeaderProps {
  /** The title of the site to display in the header */
  siteTitle?: string
  /** Whether the navigation menu is currently open */
  navOpen: boolean
  /** Function to toggle the navigation menu state */
  setNavOpen: (isOpen: boolean) => void
}

/**
 * Header component that displays the site title, social media icons, and navigation
 * @param props - The component props
 * @returns JSX element for the header
 */
const Header: React.FC<HeaderProps> = ({
  siteTitle = "",
  navOpen,
  setNavOpen,
}) => {
  return (
    <header>
      <div className="header-container">
        <div style={{ display: "flex" }}>
          <Spring isTitle>
            <div style={{ display: "flex", alignSelf: "center" }}>
              <h1 className="header-text">
                <Link
                  to="/"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    fontFamily: "Kano",
                    fontSize: "20px",
                    marginLeft: "150px",
                  }}
                >
                  {siteTitle.toUpperCase()}
                </Link>
              </h1>
            </div>
          </Spring>
          <Spring isTitle={false}>
            <a
              href="https://github.com/colorpulse6"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icons"
                src={GithubIcon}
                alt="GitHub profile link"
              />
            </a>
          </Spring>
          <Spring isTitle={false}>
            <a
              href="https://www.linkedin.com/in/nic-barnes-a3297217/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icons"
                src={LinkedinIcon}
                alt="LinkedIn profile link"
              />
            </a>
          </Spring>
        </div>
        <Spring isTitle={false}>
          <Hamburger navOpen={navOpen} setNavOpen={setNavOpen} />
        </Spring>
      </div>
    </header>
  )
}

export default Header
