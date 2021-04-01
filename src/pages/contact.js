import React from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import Slide from "react-reveal/Slide"
import Flip from "react-reveal/Flip"
import "./contact.css"

const Contact = ({ transitionStatus }) => {
  React.useEffect(() => {
    gsap.to(".contact", {
      autoAlpha: 1,
      duration: 1,
    })
  }, []) //THIS IS RUN THE FIRST TIME THE SITE IS OPENED
  React.useEffect(() => {
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
  return (
    <div>
      <SEO title="Contact" />
      <div className="container">
        <h1 style={{ paddingTop: "20px" }}>
          <Slide left>Contact Me</Slide>
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
                <Flip left>Your Name: </Flip>
                <Flip left>
                  {" "}
                  <input type="text" name="name" />
                </Flip>
              </label>
            </div>
            <div>
              <label>
                <Flip left>Your Email:</Flip>{" "}
                <Flip right>
                  {" "}
                  <input type="email" name="email" required />
                </Flip>
              </label>
            </div>

            <div>
              <label>
                <Flip left>Message: </Flip>
                <Flip left>
                  <textarea name="message"></textarea>
                </Flip>
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
    </div>
  )
}

export default Contact
