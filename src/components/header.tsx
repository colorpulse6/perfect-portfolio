import React from "react"
import { Link } from "gatsby"
import Hamburger from "./Hamburger"
import Spring from "../components/Spring"
import GithubIcon from "../images/github.png"
import LinkedinIcon from "../images/linkedin-icon.png"
import MediumIcon from "../images/medium.webp"
import NpmIcon from "../images/npm.png"
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
    <header className="site-header">
      <div className="header-container">
        <Spring isTitle>
          <div className="header-title">
            <h1 className="header-text">
              <Link className="header-link" to="/">
                {siteTitle.toUpperCase()}
              </Link>
            </h1>
          </div>
        </Spring>

        <div className="header-controls">
          <div className="header-social">
            <Spring isTitle={false}>
              <a
                className="header-social-link"
                href="https://github.com/colorpulse6"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="header-social-icon"
                  src={GithubIcon}
                  alt="GitHub profile link"
                />
              </a>
            </Spring>
            <Spring isTitle={false}>
              <a
                className="header-social-link"
                href="https://www.linkedin.com/in/nic-barnes-a3297217/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="header-social-icon"
                  src={LinkedinIcon}
                  alt="LinkedIn profile link"
                />
              </a>
            </Spring>
            <Spring isTitle={false}>
              <a
                className="header-social-link"
                href="https://medium.com/@colorpulse_6839"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="header-social-icon"
                  src={MediumIcon}
                  alt="Medium link"
                />
              </a>
            </Spring>
            <Spring isTitle={false}>
              <a
                className="header-social-link"
                href="https://www.npmjs.com/~colorpulse"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="header-social-icon"
                  src={NpmIcon}
                  alt="NPM link"
                />
              </a>
            </Spring>
          </div>

          <Spring isTitle={false}>
            <div className="header-menu-toggle">
              <Hamburger navOpen={navOpen} setNavOpen={setNavOpen} />
            </div>
          </Spring>
        </div>
      </div>
    </header>
  )
}

export default Header
