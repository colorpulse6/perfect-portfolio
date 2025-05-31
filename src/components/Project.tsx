import React, { useState } from "react"
import "../../src/pages/projects.css"
import HoopItAppGif from "../images/hoop.it.app.gif"
import FireStoreGif from "../images/fire-store-gif.gif"
import GigZillaGif from "../images/Gigzilla.gif"
import MadScienceGif from "../images/mad-science-gif.gif"
import JobToastGif from "../images/job-toast.gif"
import { Slide, Fade, Flip } from "react-awesome-reveal"

import Spring from "../components/Spring"

// Type for link hover state
interface LinkHoverState {
  active: boolean
  index: string
}

// Define the props interface for the Project component
interface ProjectProps {
  /** Name of the project */
  name: string
  /** URL link to the live project */
  link: string
  /** GitHub repository URL (optional) */
  github?: string
  /** Static image for the project */
  image: string
  /** Project description text */
  description: string
  /** Array of technology image paths */
  techArray: string[]
  /** Index position for layout alternation */
  index: number
  /** Function to scroll to a specific div (optional) */
  scrollToDiv?: () => void
  /** Whether this is a firestore project (optional) */
  firestore?: boolean
}

/**
 * Project component that displays project information with hover animations
 * @param props - The component props
 * @returns JSX element for the project display
 */
const Project: React.FC<ProjectProps> = ({
  name,
  link,
  github,
  image,
  description,
  techArray,
  index,
  scrollToDiv,
  firestore,
}) => {
  const [hover, setHover] = useState<boolean>(false)
  const [linkHover, setLinkHover] = useState<LinkHoverState>({
    active: false,
    index: "",
  })

  // Get the appropriate image source based on hover state and project name
  const getImageSource = (): string => {
    if (!hover) return image

    switch (name) {
      case "Hoop.It.App":
        return HoopItAppGif
      case "Job Toast":
        return JobToastGif
      case "Fire Store":
        return FireStoreGif
      case "Gigzilla":
        return GigZillaGif
      case "Mad Science":
        return MadScienceGif
      default:
        return image
    }
  }

  const handleMouseEnter = (): void => setHover(true)
  const handleMouseLeave = (): void => setHover(false)

  const handleLinkMouseEnter = (linkIndex: string): void => {
    setLinkHover({ active: true, index: linkIndex })
  }

  const handleLinkMouseLeave = (): void => {
    setLinkHover({ active: false, index: "" })
  }

  return (
    <>
      <div
        className={
          index % 2 === 0
            ? "project-container flex"
            : "project-container flex-reverse"
        }
      >
        <Fade>
          <img
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            src={getImageSource()}
            alt={`${name} project screenshot`}
            className="project-images"
          />
        </Fade>
        <div className="description-container">
          <Slide direction={index % 2 !== 0 ? "left" : "right"}>
            <Spring isTitle={false}>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => handleLinkMouseEnter(name)}
                onMouseLeave={handleLinkMouseLeave}
              >
                <h3
                  className={
                    linkHover.active && linkHover.index === name
                      ? "background-video project-title"
                      : "project-title"
                  }
                >
                  {name}
                </h3>
                <span>{name === "Gigzilla" && " (Deprecated)"}</span>
              </a>
            </Spring>
            <p>{description}</p>
          </Slide>
          <Flip direction="horizontal" cascade duration={500}>
            <div>
              {github && (
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => handleLinkMouseEnter("github")}
                  onMouseLeave={handleLinkMouseLeave}
                >
                  <Spring isTitle={true}>
                    <h2
                      className={
                        linkHover.active && linkHover.index === "github"
                          ? "background-video"
                          : ""
                      }
                    >
                      Github
                    </h2>
                  </Spring>
                </a>
              )}

              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => handleLinkMouseEnter("link")}
                onMouseLeave={handleLinkMouseLeave}
              >
                <Spring isTitle={true}>
                  <h2
                    className={
                      linkHover.active && linkHover.index === "link"
                        ? "background-video"
                        : ""
                    }
                  >
                    URL
                  </h2>
                </Spring>
              </a>
            </div>
          </Flip>
        </div>
      </div>

      <div className="tech-container">
        {techArray.map((imageSource: string, i: number) => (
          <img
            key={i}
            className="tech-image"
            src={imageSource}
            alt={`Technology ${i + 1}`}
          />
        ))}
      </div>

      {index !== 4 ? <hr /> : null}
    </>
  )
}

export default Project
