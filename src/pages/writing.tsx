import React, { useEffect, useState } from "react"
import "./writing.css"
import Spring from "../components/Spring"
import { graphql, useStaticQuery } from "gatsby"
import gsap from "gsap"
import SEO from "../components/seo"

// Type for individual writing/story item
interface WritingItem {
  title: string
  content: string
}

// Type for GraphQL query result
interface WritingQueryData {
  allWriting: {
    nodes: WritingItem[]
  }
}

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

// Define the props interface for the Writing page
interface WritingProps {
  /** Transition status from gatsby-plugin-transition-link */
  transitionStatus?: string
  /** Location object from Gatsby router */
  location?: GatsbyLocation
}

/**
 * Converts plain text with \n to properly formatted HTML
 * @param text - The plain text content with \n line breaks
 * @returns Formatted HTML string
 */
const formatTextContent = (text: string): string => {
  // Split by double line breaks for paragraphs
  const paragraphs = text.split("\n\n")

  return paragraphs
    .map(paragraph => {
      // Handle single line breaks within paragraphs
      let formattedParagraph = paragraph.replace(/\n/g, "<br />").trim()

      // Don't wrap empty paragraphs
      if (!formattedParagraph) {
        return "<br />"
      }

      // Enhanced formatting for dialogue and emphasis
      formattedParagraph = formattedParagraph
        // Handle em dashes and special punctuation
        .replace(/--/g, "—")
        // Handle emphasis with asterisks
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        // Handle strong emphasis
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

      // Preserve leading spaces for indentation
      const leadingSpaces = paragraph.match(/^(\s+)/)
      const indentation = leadingSpaces
        ? leadingSpaces[1].replace(/ /g, "&nbsp;")
        : ""

      // Special handling for lines that look like dialogue
      const isDialogue =
        formattedParagraph.includes('"') &&
        (formattedParagraph.includes('"') || formattedParagraph.includes("'"))

      const paragraphClass = isDialogue
        ? "story-paragraph dialogue-paragraph"
        : "story-paragraph"

      return `<p class="${paragraphClass}">${indentation}${formattedParagraph}</p>`
    })
    .join("")
}

/**
 * Writing page component that displays a collection of written stories
 * @param props - The component props
 * @returns JSX element for the writing page
 */
const Writing: React.FC<WritingProps> = ({ transitionStatus, location }) => {
  const data: WritingQueryData = useStaticQuery(graphql`
    query MyWritingQuery {
      allWriting {
        nodes {
          title
          content
        }
      }
    }
  `)

  const [renderStory, setRenderStory] = useState<string | undefined>(undefined)
  const [active, setActive] = useState<number | null>(null)

  // Handle page transition animations
  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".writings", {
        autoAlpha: 1,
        duration: 1, // if we are entering the page, make the div visible
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".writings", {
        autoAlpha: 0,
        duration: 0.03,
      }) // if we are exiting the page, make the div transparent
    }
  }, [transitionStatus])

  // Initial page load animation
  useEffect(() => {
    gsap.to(".writings", {
      autoAlpha: 1,
      duration: 0.5,
    })
  }, [])

  const story = (title: string): React.ReactNode => {
    return data.allWriting.nodes.map((storyItem, index) => {
      if (storyItem.title === title) {
        const formattedContent = formatTextContent(storyItem.content)

        return (
          <div key={index} className="story-container">
            <h2 className="rendered-title">{storyItem.title}</h2>
            <div
              className="story-content"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </div>
        )
      }
      return null
    })
  }

  const handleStoryClick = (storyTitle: string, index: number): void => {
    setRenderStory(storyTitle)
    setActive(index)
  }

  return (
    <div style={{ opacity: 0, position: "relative" }} className="writings">
      <SEO title="writings" />
      <div className="writing">
        <h1>The ruptured adventures of a crafted coil</h1>
      </div>

      <div className="title-container" id="examples">
        {data.allWriting.nodes.map((storyItem, index) => {
          return (
            <div
              key={index}
              className={`${active === index ? "story-card " : "story-card"}`}
              onClick={() => handleStoryClick(storyItem.title, index)}
            >
              <Spring isTitle={false}>
                <div className="example">
                  <span
                    className={`${
                      active === index
                        ? "story-item selected background-video"
                        : "hover hover-1 story-item"
                    }`}
                  >
                    {storyItem.title}
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
