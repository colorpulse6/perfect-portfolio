import React, { useEffect } from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import SideBarCollapsed from "../components/SideBarCollapsed"
import Spring from "../components/Spring"
import {Link} from "gatsby"
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
          {location.pathname.substring(1).replace(/\/$/, "")}
        </p>
        <div className="about-content">
          <p>
            I’m a web developer originally from Seattle, now based in Madrid. My passion for solving complex problems creatively drives everything I do—whether it’s building innovative web applications, composing orchestral music, or experimenting with building corny video games. I approach both programming and life with full commitment, seeking to learn, grow, and tackle new challenges.
          </p>
        <p>
          My journey into programming began in 2019 while working as a musician, but it wasn’t until the global pandemic in 2020 that I had the opportunity to pursue coding full-time. I enrolled in the Ironhack Full-stack Web Development Bootcamp, where I deepened my skills in JavaScript, React, and Node.js/Express. This transition was seamless for me—my background in music provided a perfect foundation. Both music and programming require precision, creativity, and an ability to break down complex systems into manageable pieces.
        </p>
          <p>Before programming, I worked as an audio technician, bandleader, composer, and manager. My diverse career in music shaped my approach to development—emphasizing clear communication, collaboration, leadership, and attention to detail. These soft skills, combined with my technical expertise, allow me to tackle complex projects with confidence and efficiency.</p>
        <p>I treat my code as I would my compositions—carefully crafted, well-organized, and always striving for improvement. Whether working on a challenging feature or an intricate piece of music, I enjoy the process of pushing my limits and delivering something I can be proud of. I’m always eager to learn and take on new challenges in the world of web development.</p>
        </div>
      </div>
      <div className="external-container">
      {/*<Spring><a href="https://alexshand.bandcamp.com/" target="_blank">*/}
      {/*    <h1 className="background-video">Music</h1>*/}
      {/*  </a></Spring>*/}
      {/*  <Spring><a*/}
      {/*    href="https://www.tumblr.com/blog/craftedcoils-blog-blog"*/}
      {/*    target="_blank"*/}
      {/*  >*/}
      {/*    {" "}*/}
      {/*    <h1 className="background-video">Writing</h1>*/}
      {/*  </a></Spring>*/}
        <Spring><a href="https://alexshand.bandcamp.com/" target="_blank">
          <h1 className="background-video">Music</h1>
        </a></Spring>
        <Spring><h1><Link className="background-video" to="/writing/">Writing</Link></h1></Spring>
      </div>
    </>
  )
}

export default About
