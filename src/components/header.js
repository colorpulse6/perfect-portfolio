import * as React from "react"
import PropTypes from "prop-types"
import { Link } from "gatsby"
import Hamburger from "./Hamburger"
import Spring from "../components/Spring"
const Header = props => {
  return (
    <header
      style={{
        marginBottom: `1.45rem`,
      }}
    >
      <div
        style={{
          margin: `0 auto`,
          // maxWidth: 960,
          padding: `1.45rem 1.0875rem`,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Spring>
          <h1 style={{ margin: "-50px 0 50px -80px" }}>
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
        </Spring>
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
