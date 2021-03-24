import React, { useState, useEffect } from "react"
import "../../src/pages/projects.css"
import JobToastGif from "../images/job-toast-gif.gif"
import HoopItAppGif from "../images/hoop.it.app.gif"
import FireStoreGif from "../images/fire-store-gif.gif"
import GigZillaGif from "../images/Gigzilla.gif"
import MadScienceGif from '../images/mad-science-gif.gif'
const Project = ({ name, image, description, techArray, index }) => {
  console.log(index)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (hover) console.log(name)
  }, [hover])
  return (
    <>
      <div
        className={
          index % 2 == 0
            ? "project-container flex"
            : "project-container flex-reverse"
        }
      >
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
        <div className="description-container">
          <h1>{name}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="tech-container">
        {techArray.map(image => {
          return <img className="tech-image" src={image} />
        })}
      </div>
    </>
  )
}

export default Project
