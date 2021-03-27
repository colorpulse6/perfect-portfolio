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
        style={{
          margin: `0 auto`,
          // maxWidth: 960,
          padding: `1.45rem 1.0875rem`,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>
          <Spring isTitle>
            <div style={{ display: "flex", alignSelf: "center" }}>
              <h1 style={{ margin: "-50px 0 0 -80px" }}>
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
