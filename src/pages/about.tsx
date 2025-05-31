import React, { useEffect } from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import SideBarCollapsed from "../components/SideBarCollapsed"
import Spring from "../components/Spring"
import { Link } from "gatsby"
import "./about.css"

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

// Define the props interface for the About page
interface AboutProps {
  /** Transition status from gatsby-plugin-transition-link */
  transitionStatus?: string
  /** Location object from Gatsby router */
  location: GatsbyLocation
}

/**
 * About page component that displays personal information and links
 * @param props - The component props
 * @returns JSX element for the about page
 */
const About: React.FC<AboutProps> = ({ transitionStatus, location }) => {
  // Handle page transition animations
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

  // Initial page load animation
  useEffect(() => {
    gsap.to(".about", {
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

      <div style={{ opacity: 0, position: "relative" }} className="about">
        <SEO title="About" />
        <p className="second-title background-video">
          {location.pathname.substring(1).replace(/\/$/, "")}
        </p>
        <div className="about-content">
          <p>
            I'm a web developer originally from Seattle, now based in Madrid. My
            passion for solving complex problems creatively drives everything I
            do—whether it's building innovative web applications, composing
            orchestral music, or experimenting with building corny video games.
            I approach both programming and life with full commitment, seeking
            to learn, grow, and tackle new challenges.
          </p>
          <p>
            My journey into programming began in 2019 while working as a
            musician, but it wasn't until the global pandemic in 2020 that I had
            the opportunity to pursue coding full-time. I enrolled in the
            Ironhack Full-stack Web Development Bootcamp, where I deepened my
            skills in JavaScript, React, and Node.js/Express. This transition
            was seamless for me—my background in music provided a perfect
            foundation. Both music and programming require precision,
            creativity, and an ability to break down complex systems into
            manageable pieces.
          </p>
          <p>
            Before programming, I worked as an audio technician, bandleader,
            composer, and manager. My diverse career in music shaped my approach
            to development—emphasizing clear communication, collaboration,
            leadership, and attention to detail. These soft skills, combined
            with my technical expertise, allow me to tackle complex projects
            with confidence and efficiency.
          </p>
          <p>
            I treat my code as I would my compositions—carefully crafted,
            well-organized, and always striving for improvement. Whether working
            on a challenging feature or an intricate piece of music, I enjoy the
            process of pushing my limits and delivering something I can be proud
            of. I'm always eager to learn and take on new challenges in the
            world of web development.
          </p>
        </div>
      </div>
      <div className="external-container">
        <Spring isTitle={false}>
          <a
            href="https://alexshand.bandcamp.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h1 className="background-video">Music</h1>
          </a>
        </Spring>
        <Spring isTitle={false}>
          <h1>
            <Link className="background-video" to="/writing/">
              Writing
            </Link>
          </h1>
        </Spring>
      </div>
    </>
  )
}

export default About
