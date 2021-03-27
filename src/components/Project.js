import React, { useState, useRef, useEffect } from "react"
import "../../src/pages/projects.css"
import JobToastGif from "../images/job-toast-gif.gif"
import HoopItAppGif from "../images/hoop.it.app.gif"
import FireStoreGif from "../images/fire-store-gif.gif"
import GigZillaGif from "../images/Gigzilla.gif"
import MadScienceGif from "../images/mad-science-gif.gif"
import Slide from "react-reveal/Slide"
import Fade from "react-reveal/Fade"
import Flip from "react-reveal/Flip"
import Tada from "react-reveal/Tada"
import Spring from "../components/Spring"
import arrowDown from "../images/arrow-down.png"
import arrowUp from "../images/up-arrow.png"

const Project = ({
  name,
  link,
  github,
  image,
  description,
  techArray,
  index,
  refString,
  executeScroll,
}) => {
  const [hover, setHover] = useState(false)
  const [linkHover, setLinkHover] = useState({ active: false, index: "" })

  return (
    <>
      <div
        className={
          index % 2 == 0
            ? "project-container flex"
            : "project-container flex-reverse"
        }
      >
        <Fade>
          <img
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            src={
              hover && name === "Hoop.It.App"
                ? HoopItAppGif
                : hover && name === "Job Toast"
                ? JobToastGif
                : hover && name === "Fire Store"
                ? FireStoreGif
                : hover && name === "Gigzilla"
                ? GigZillaGif
                : hover && name === "Mad Science"
                ? MadScienceGif
                : image
            }
            className="project-images"
          />
        </Fade>
        <div className="description-container">
          <Slide left={index % 2 == 0} right={index % 2 != 0}>
            <Spring>
              <a
                href={link}
                target="_blank"
                onMouseEnter={() => setLinkHover({ active: true, index: name })}
                onMouseLeave={() => setLinkHover({ active: false, index: "" })}
              >
                <h3
                  className={
                    linkHover.active && linkHover.index === name
                      ? "background-video project-title"
                      : " project-title"
                  }
                >
                  {name}
                </h3>
              </a>
            </Spring>
          </Slide>
          <Flip left opposite cascade collapse>
            <div>
              <p>{description}</p>
              <a
                href={github}
                onMouseEnter={() =>
                  setLinkHover({ active: true, index: "github" })
                }
                onMouseLeave={() => setLinkHover({ active: false, index: "" })}
              >
                <Spring isTitle>
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
              <a
                href={link}
                onMouseEnter={() =>
                  setLinkHover({ active: true, index: "link" })
                }
                onMouseLeave={() => setLinkHover({ active: false, index: "" })}
              >
                <Spring isTitle>
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
        {techArray.map((image, i) => {
          return (
            <Tada key={i}>
              <img className="tech-image" src={image} />
            </Tada>
          )
        })}
      </div>
      {index != 4 ? (
        <img
          onClick={() => console.log("executeScroll"+refString)}
          src={arrowDown}
          className="icons"
          style={{ margin: "0 auto" }}
        />
      ) : (
        <img
          src={arrowUp}
          className="icons"
          style={{
            transform: "rotate(180deg)",
            margin: "0 auto",
          }}
        />
      )}
    </>
  )
}

export default Project
