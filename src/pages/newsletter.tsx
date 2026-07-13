import React from "react"
import { graphql } from "gatsby"
import TransitionLink from "gatsby-plugin-transition-link"
import SEO from "../components/seo"
import SideBarCollapsed from "../components/SideBarCollapsed"
import { GatsbyLocation } from "../types/gatsby"
import { usePageTransition } from "../helpers/usePageTransition"
import "./newsletter.css"

interface NewsletterNode {
  fields: {
    slug: string
  }
  frontmatter: {
    title: string
    date: string
    issue: number
    deck: string
    hero: string | null
  }
}

interface NewsletterPageProps {
  transitionStatus?: string
  location: GatsbyLocation
  data: {
    allMarkdownRemark: {
      nodes: NewsletterNode[]
    }
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

const NewsletterPage: React.FC<NewsletterPageProps> = ({
  transitionStatus,
  location,
  data,
}) => {
  usePageTransition(transitionStatus, ".newsletter-index", { enter: 1, exit: 0.3, mount: 1 })

  const issues = data?.allMarkdownRemark?.nodes || []

  return (
    <>
      <SideBarCollapsed
        currentWindow={location.pathname}
        transitionStatus={transitionStatus}
        menuLinks={[]}
      />

      <div style={{ opacity: 0, position: "relative" }} className="newsletter-index">
        <SEO
          title="Newsletter"
          description="A weekly builder's notebook from Nichalas Barnes."
          pathname={location?.pathname}
        />
        <p className="second-title background-video" aria-hidden="true">
          newsletter
        </p>

        <div className="newsletter-index-content">
          <h1 className="newsletter-index-heading">Newsletter</h1>

          {issues.length === 0 ? (
            <p className="newsletter-empty">First issue coming soon.</p>
          ) : (
            <div className="newsletter-list">
              {issues.map((node) => {
                const fm = node.frontmatter
                return (
                  <article key={node.fields.slug} className="newsletter-row">
                    <div className="newsletter-row-meta">
                      <span>Issue #{fm.issue}</span>
                      <span>{formatDate(fm.date)}</span>
                    </div>
                    <h2 className="newsletter-row-title">
                      <TransitionLink
                        to={`/newsletter/${node.fields.slug}`}
                        exit={{ length: 0.5 }}
                        entry={{ length: 0.5 }}
                      >
                        {fm.title}
                      </TransitionLink>
                    </h2>
                    <p className="newsletter-row-deck">{fm.deck}</p>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export const query = graphql`
  query NewsletterIndex {
    allMarkdownRemark(
      filter: { fields: { sourceInstanceName: { eq: "newsletter" } } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          date
          issue
          deck
          hero
        }
      }
    }
  }
`

export default NewsletterPage
