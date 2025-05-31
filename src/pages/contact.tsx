import React, { useEffect } from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import { Slide, Flip } from "react-awesome-reveal"
import "./contact.css"
import SideBarCollapsed from "../components/SideBarCollapsed"

// Type for location object from Gatsby
interface GatsbyLocation {
  pathname: string
  search?: string
  hash?: string
  href?: string
  origin?: string
  protocol?: string
  host?: string
  hostname?: string
  port?: string
  state?: any
  key?: string
}

// Define the props interface for the Contact page
interface ContactProps {
  /** Transition status from gatsby-plugin-transition-link */
  transitionStatus?: string
  /** Location object from Gatsby router */
  location: GatsbyLocation
}

/**
 * Contact page component with a contact form and animations
 * @param props - The component props
 * @returns JSX element for the contact page
 */
const Contact: React.FC<ContactProps> = ({ transitionStatus, location }) => {
  // Handle page transition animations
  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".contact", {
        autoAlpha: 1,
        duration: 1, // if we are entering the page, make the div visible
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".contact", {
        autoAlpha: 0,
        duration: 0.3,
      }) // if we are exiting the page, make the div transparent
    }
  }, [transitionStatus])

  // Initial page load animation
  useEffect(() => {
    gsap.to(".contact", {
      autoAlpha: 1,
      duration: 1,
    })
  }, [])

  return (
    <>
      <SideBarCollapsed
        currentWindow={location.pathname}
        transitionStatus={transitionStatus}
        menuLinks={[]}
      />
      <SEO title="Contact" />
      <div className="container contact">
        <h1 className="contact-title background-video">
          {location.pathname.substring(1).replace(/\/$/, "")}
        </h1>
        <h4 className="lead">
          <Slide direction="right">
            Have a question or want to work together?
          </Slide>
        </h4>
        <form
          name="contact"
          method="POST"
          data-netlify="true"
          action="/formSuccess"
          netlify-honeypot="bot-field"
        >
          <input type="hidden" name="bot-field" />
          <input type="hidden" name="form-name" value="contact" />
          <div className="main">
            <div>
              <label>
                <Flip direction="horizontal" duration={300}>
                  Your Name:
                </Flip>
                <span>
                  <input type="text" name="name" />
                </span>
              </label>
            </div>
            <div>
              <label>
                <Flip direction="horizontal" duration={300}>
                  Your Email:
                </Flip>
                <span>
                  <input type="email" name="email" required />
                </span>
              </label>
            </div>

            <div>
              <label>
                <Flip direction="horizontal" duration={300}>
                  Message:
                </Flip>
                <span>
                  <textarea name="message" />
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            style={{ marginTop: "-20px" }}
            className="btn effect01"
          >
            <span>Send</span>
          </button>
        </form>
      </div>
    </>
  )
}

export default Contact
