import * as React from "react"
import PropTypes from "prop-types"
import { Link } from "gatsby"
import Hamburger from "./Hamburger"
import Spring from "../components/Spring"
import GithubIcon from "../images/github.png"
import LinkedinIcon from "../images/linkedin-icon.png"
import "./header.css"
const Header = props => {
  
  return (
    <header>
      <div
      className="header-container"
        
      >
        <div style={{ display: "flex" }}>
          <Spring isTitle>
            <div style={{ display: "flex", alignSelf: "center" }}>
              <h1 className="header-text " >
                <Link
                  to="/"
                  style={{
                    color: `white`,
                    textDecoration: `none`,
                    fontFamily: "Kano",
                    fontSize: "20px",
                    marginLeft: "150px",
                  }}
                >
                  {props.siteTitle.toUpperCase()}
                </Link>
              </h1>
            </div>
          </Spring>
          <Spring>
            <a href="https://github.com/colorpulse6" target="_blank">
              <img className="icons" src={GithubIcon} />
            </a>{" "}
          </Spring>
          <Spring>
            {" "}
            <a
              href="https://www.linkedin.com/in/nic-barnes-a3297217/"
              target="_blank"
            >
              {" "}
              <img className="icons" src={LinkedinIcon} />
            </a>
          </Spring>
        </div>
        <Spring>
          <Hamburger navOpen={props.navOpen} setNavOpen={props.setNavOpen} />
        </Spring>
      </div>
    </header>
  )
}
Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
