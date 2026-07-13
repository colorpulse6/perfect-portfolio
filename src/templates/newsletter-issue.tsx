import React from "react"
import { graphql } from "gatsby"
import TransitionLink from "gatsby-plugin-transition-link"
import SEO from "../components/seo"
import SideBarCollapsed from "../components/SideBarCollapsed"
import { GatsbyLocation } from "../types/gatsby"
import { usePageTransition } from "../helpers/usePageTransition"
import "./newsletter-issue.css"

interface NewsletterIssueNode {
  html: string
  frontmatter: {
    title: string
    date: string
    issue: number
    deck: string
  }
}

interface NewsletterIssueProps {
  transitionStatus?: string
  location: GatsbyLocation
  data: {
    markdownRemark: NewsletterIssueNode
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const NewsletterIssue: React.FC<NewsletterIssueProps> = ({
  transitionStatus,
  location,
  data,
}) => {
  usePageTransition(transitionStatus, ".newsletter-issue", { enter: 1, exit: 0.3, mount: 1 })

  const issue = data.markdownRemark
  const fm = issue.frontmatter

  return (
    <>
      <SideBarCollapsed
        currentWindow={location.pathname}
        transitionStatus={transitionStatus}
        menuLinks={[]}
      />

      <article style={{ opacity: 0, position: "relative" }} className="newsletter-issue">
        <SEO
          title={fm.title}
          description={fm.deck}
          pathname={location?.pathname}
        />

        <div className="newsletter-issue-content">
          <TransitionLink
            to="/newsletter"
            exit={{ length: 0.5 }}
            entry={{ length: 0.5 }}
            className="newsletter-back"
          >
            ← NEWSLETTER
          </TransitionLink>

          <p className="newsletter-issue-meta">
            Issue #{fm.issue} · {formatDate(fm.date)}
          </p>
          <h1>{fm.title}</h1>
          <p className="newsletter-issue-lede">{fm.deck}</p>

          <div
            className="newsletter-body"
            dangerouslySetInnerHTML={{ __html: issue.html }}
          />
        </div>
      </article>
    </>
  )
}

export const query = graphql`
  query NewsletterIssue($slug: String!) {
    markdownRemark(
      fields: {
        slug: { eq: $slug }
        sourceInstanceName: { eq: "newsletter" }
      }
    ) {
      html
      frontmatter {
        title
        date
        issue
        deck
      }
    }
  }
`

export default NewsletterIssue
