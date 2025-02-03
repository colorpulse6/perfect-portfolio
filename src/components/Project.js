import React, { useState } from "react"
import "../../src/pages/projects.css"
import HoopItAppGif from "../images/hoop.it.app.gif"
import FireStoreGif from "../images/fire-store-gif.gif"
import GigZillaGif from "../images/Gigzilla.gif"
import MadScienceGif from "../images/mad-science-gif.gif"
import JobToastGif from "../images/job-toast.gif"
import { Slide, Fade ,Flip  } from "react-awesome-reveal"

import Spring from "../components/Spring"

const Project = ({
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
          <Slide direction={index % 2 !== 0 ? "left" : "right"}>            <Spring>
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
               <span> {name === "Gigzilla" && " (Deprecated)"}</span>
              </a>
            </Spring>
            <p>{description}</p>

          </Slide>
          <Flip left opposite cascade collapse duration={500}>
            <div>

              <a
                href={github}
                target="_blank"
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
                target="_blank"
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
            // <Tada key={i}>
              <img className="tech-image" src={image} />
            // </Tada>
          )
        })}
      </div>
      {/* {index != 4 ? (
        <img
          onClick={() => {
            window.scrollBy(0, 1285)
          }}
          src={arrowDown}
          className="icons"
          style={{
            margin: "0 auto",
            marginTop: "100px",
            marginBottom: "450px",
          }}
        />
      ) : (
        <img
          onClick={() => {
            window.scrollTo(0, 0)
          }}
          src={arrowUp}
          className={firestore ? "fire-store icons" : "icons"}
          style={{
            transform: "rotate(180deg)",
            margin: "0 auto",
            marginTop: name == "Fire Store" ? "550px" : "100px",
          }}
        />
      )} */}
      {index !== 4?  <hr></hr> : null}
    </>
  )
}

export default Project
