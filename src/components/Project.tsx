import React, { useState } from "react"
import "../../src/pages/projects.css"
import {
  LOCAL_PRIMARY_IMAGES,
  PRIMARY_VIDEOS,
  HOVER_VIDEOS,
} from "../helpers/projectImages"
import { Fade, Flip } from "react-awesome-reveal"
import TransitionLink from "gatsby-plugin-transition-link"

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
  /** Slug for the project's detail page (/projects/<slug>) */
  slug: string
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
  slug,
  github,
  image,
  description,
  techArray,
  index,
  firestore,
}) => {
  const [linkHover, setLinkHover] = useState<LinkHoverState>({
    active: false,
    index: "",
  })

  const handleLinkMouseEnter = (linkIndex: string): void => {
    setLinkHover({ active: true, index: linkIndex })
  }

  const handleLinkMouseLeave = (): void => {
    setLinkHover({ active: false, index: "" })
  }

  const isPortraitProject = name === "Throttle"
  const isContainProject = name === "Cerebro"
  const imageClassName = isPortraitProject
    ? "project-images project-images--portrait"
    : isContainProject
      ? "project-images project-images--contain"
    : "project-images"

  // Animated previews ship as small MP4 clips and play on hover (matching the
  // original GIF-on-hover behavior). Hover clips use the Cloudinary screenshot as
  // the resting poster; primary clips rest on their own first frame.
  const renderMedia = () => {
    const video = PRIMARY_VIDEOS[name] || HOVER_VIDEOS[name]
    if (video) {
      return (
        <video
          className={imageClassName}
          src={video}
          poster={HOVER_VIDEOS[name] ? image : undefined}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`${name} preview`}
          onMouseEnter={e => {
            e.currentTarget.play().catch(() => {})
          }}
          onMouseLeave={e => {
            e.currentTarget.pause()
            e.currentTarget.currentTime = 0
          }}
        />
      )
    }
    return (
      <img
        className={imageClassName}
        src={LOCAL_PRIMARY_IMAGES[name] || image}
        alt={`${name} project screenshot`}
        loading="lazy"
      />
    )
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
        <Fade>{renderMedia()}</Fade>
        <div className="description-container">
          <Fade>
            <div className="project-copy-reveal">
              <Spring isTitle={false}>
                <TransitionLink
                  to={`/projects/${slug}`}
                  exit={{ length: 0.5 }}
                  entry={{ length: 0.5 }}
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
                </TransitionLink>
              </Spring>
              <p>{description}</p>
            </div>
          </Fade>
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
