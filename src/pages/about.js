import React, { useEffect } from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import SideBarCollapsed from "../components/SideBarCollapsed"
import Link from "gatsby"
import "./about.css"
const About = ({ transitionStatus, location }) => {
  
  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".about", {
        autoAlpha: 1,
        duration: 1,
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".about", { autoAlpha: 0, duration: 0.3 })
    }
  }, [transitionStatus])
  useEffect(() => {
    gsap.to(".about", {
      autoAlpha: 1,
      duration: 1,
    })
  }, [])
  return (
    <>
    {" "}
      <SideBarCollapsed currentWindow={location.pathname} />

      <div style={{ opacity: 0, position: "relative"}} className="about">
        <SEO title="About" />
        <p className="second-title background-video">
          {location.pathname.substring(1)}
        </p>
        <div className="about-content">
          <p>
            I am a web developer from Seattle now living in Berlin. I am
            interested in creative solutions to complex problems. I like to make
            corny video games, arrange orchestral music and solve math problems.
            My passion for programming is wrapped in a deep interest in science
            and technology.
          </p>
          <p>
            I have a background as a professional audio technician, composer,
            and musician. In 2019 I decided to start to learn to code but was
            unable to fully commit due to my full-time work as a musician. In
            March of 2020, the Corona virus effectively disabled musicians
            around the world provided a window of opportunity for me to study
            programming full-time. <br></br>I attended the Iron Hack Full-stack
            Web Development Bootcamp from May - July 2020 which helped solidify
            my knowledge of JavaScript, React, and Node.js/Express. My previous
            commitment to music enabled a perfect transition into programming
            and I basically transplanted my passion from one to the other.
            Whatever I choose to do in my life, I do it with full commitment,
            and since I have chosen to be a programmer I have been completely
            invested in learning more and building projects. I believe the
            skills I obtained working as an audio technician, bandleader,
            manager, fund-raiser, composer, and performer have suited me well as
            a web developer. Not only do the hard skills transition nicely from
            one discipline to the other but the soft skills as well such as
            strong communication, conflict management, leadership, teamwork,
            self-responsibility, and professionalism. <br></br> I treat my code
            as I would treat my compositions, with care, attention to detail,
            and a high level of organization. I am an ardent disciple of
            challenging and difficult music and I would say the same is true for
            programming. I like to challenge myself with complex systems and
            applications that require strict organization and planning. In the
            end, I feel the effort is worth it and I have something that I can
            be proud of. I am always looking to learn more and grow as a
            developer.
          </p>
        </div>
      </div>
      <div className="external-container">
        <a href="https://alexshand.bandcamp.com/" target="_blank">
          <h1 className="background-video">Music</h1>
        </a>
        <a
          href="https://www.tumblr.com/blog/craftedcoils-blog-blog"
          target="_blank"
        >
          {" "}
          <h1 className="background-video">Writing</h1>
        </a>
      </div>
    </>
  )
}

export default About
