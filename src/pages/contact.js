import React, { useEffect } from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import { Slide,Flip } from "react-awesome-reveal"
import "./contact.css"
import SideBarCollapsed from "../components/SideBarCollapsed"

const Contact = ({ transitionStatus, location }) => {
  //THIS IS RUN THE FIRST TIME THE SITE IS OPENED
  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".contact", {
        autoAlpha: 1,
        duration: 1, //if we are entering the page, let's make the div with class .hometex visible in one second
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".contact", { autoAlpha: 0, duration: 0.3 }) //if we are exiting  the page, let's make the div with class .hometex transparent in one second
    }
  }, [transitionStatus])
  useEffect(() => {
    gsap.to(".contact", {
      autoAlpha: 1,
      duration: 1,
    })
  }, [])
  return (
    <>
      <SideBarCollapsed currentWindow={location.pathname} />
      <SEO title="Contact" />
      <div className="container contact">
        <h1 className="contact-title background-video">
          {location.pathname.substring(1).replace(/\/$/, "")}
        </h1>
        <h4 className="lead">
          <Slide right>Have a question or want to work together?</Slide>
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
                <Flip left duration={300}>Your Name: </Flip>
                <span >
                  {" "}
                  <input type="text" name="name" />
                </span>
              </label>
            </div>
            <div>
              <label>
                <Flip right duration={300}>Your Email:</Flip>{" "}
                <span >
                  {" "}
                  <input type="email" name="email" required />
                </span>
              </label>
            </div>

            <div>
              <label>
                <Flip left duration={300}>Message: </Flip>
                <span >
                  <textarea name="message"></textarea>
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
