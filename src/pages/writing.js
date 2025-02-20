import React, { useEffect, useState } from "react"
import "./writing.css"
import Spring from "../components/Spring"
import { graphql, useStaticQuery } from "gatsby"
import gsap from "gsap"
import SEO from "../components/seo"

const Writing = ({ transitionStatus, location }) => {
  const data = useStaticQuery(graphql`
    query MyWritingQuery {
      allWriting {
        nodes {
          title
          content
        }
      }
    }
  `)

  const [renderStory, setRenderStory] = useState(undefined)
  const [active, setActive] = useState(null)

  //THIS IS RUN THE FIRST TIME THE SITE IS OPENED
  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".writings", {
        autoAlpha: 1,
        duration: 1, //if we are entering the page, let's make the div with class .hometex visible in one second
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".writings", { autoAlpha: 0, duration: 0.03 }) //if we are exiting  the page, let's make the div with class .hometex transparent in one second
    }
  }, [transitionStatus])
  useEffect(() => {
    gsap.to(".writings", {
      autoAlpha: 1,
      duration: 0.5,
    })
  }, [])

  const story = title => {
    return data.allWriting.nodes.map((story, index) => {
      if (story.title === title) {
        return (
          <div className="story-container">
            <p className="rendered-title">{story.title}</p>
            <p
              key={index}
              dangerouslySetInnerHTML={{ __html: story.content }}
            />
          </div>
        )
      }
    })
  }

  return (
    <div style={{ opacity: 0, position: "relative" }} className="writings">
      <SEO title="writings" />
      <div className="writing">
        <h1>The ruptured adventures of a crafted coil</h1>
      </div>

      <div className="title-container" id="examples">
        {data.allWriting.nodes.map((story, index) => {
          return (
            <div
              key={index}
              className={`${active === index ? "story-card " : "story-card"}`}
              onClick={() => {
                setRenderStory(story.title)
                setActive(index)
              }}
            >
              <Spring>
                <div className="example">
                  <span
                    className={`${active === index ? "story-item selected background-video" : "hover hover-1 story-item"}`}
                  >
                    {story.title}
                  </span>
                </div>
              </Spring>
            </div>
          )
        })}
      </div>
      {renderStory ? <div className="story">{story(renderStory)}</div> : null}
    </div>
  )
}

export default Writing
