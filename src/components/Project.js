import React, {useState, useEffect} from "react"
import "../../src/pages/projects.css"

const Project = ({ name, image, description, techArray, index }) => {
  console.log(index)
  return (
    <div className={index % 2 == 0 ? "project-container flex" : "project-container flex-reverse"}>
      <img src={image} className="project-images" />
      <div className="description-container">
        <h1>{name}</h1>
        <p>
          {description}
        </p>
        <div className="tech-container">
        {techArray.map((image)=>{
            return <img className="tech-image" src={image} />
        })}
        </div>
      </div>
    </div>
  )
}

export default Project
