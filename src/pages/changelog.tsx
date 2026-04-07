import React, { useEffect, useState } from "react"
import { graphql } from "gatsby"
import gsap from "gsap"
import SEO from "../components/seo"
import SideBarCollapsed from "../components/SideBarCollapsed"
import "./changelog.css"

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

interface ChangelogNode {
  frontmatter: {
    title: string
    date: string
    type: string
    link: string | null
    status: string | null
    project: string | null
  }
  html: string
  excerpt: string
}

interface ChangelogPageProps {
  transitionStatus?: string
  location: GatsbyLocation
  data: {
    allMarkdownRemark: {
      nodes: ChangelogNode[]
    }
  }
}

const TYPE_COLORS: Record<string, string> = {
  project: "#5b8def",
  writing: "#d4a053",
  update: "#4aba7a",
}

const STATUS_LABELS: Record<string, string> = {
  "in-progress": "In Progress",
  released: "Released",
  published: "Published",
}

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "project", label: "Projects" },
  { key: "writing", label: "Writing" },
  { key: "update", label: "Updates" },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const ChangelogPage: React.FC<ChangelogPageProps> = ({
  transitionStatus,
  location,
  data,
}) => {
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".changelog", { autoAlpha: 1, duration: 1 })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".changelog", { autoAlpha: 0, duration: 0.3 })
    }
  }, [transitionStatus])

  useEffect(() => {
    gsap.to(".changelog", { autoAlpha: 1, duration: 1 })
  }, [])

  const entries = (data?.allMarkdownRemark?.nodes || []).filter(
    (n) => filter === "all" || n.frontmatter.type === filter
  )

  return (
    <>
      <SideBarCollapsed
        currentWindow={location.pathname}
        transitionStatus={transitionStatus}
        menuLinks={[]}
      />

      <div style={{ opacity: 0, position: "relative" }} className="changelog">
        <SEO title="Changelog" />
        <p className="second-title background-video">
          {location.pathname.substring(1).replace(/\/$/, "")}
        </p>

        <div className="changelog-content">
          <div className="changelog-filters">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`changelog-filter-pill${filter === opt.key ? " active" : ""}`}
                onClick={() => setFilter(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {entries.length === 0 && (
            <p className="changelog-empty">No entries yet.</p>
          )}

          {entries.map((node, idx) => {
            const fm = node.frontmatter
            const typeColor = TYPE_COLORS[fm.type] || "#888"

            return (
              <div key={idx} className="changelog-entry">
                <div className="changelog-entry-meta">
                  <span className="changelog-entry-date">
                    {formatDate(fm.date)}
                  </span>
                  <span
                    className="changelog-entry-type"
                    style={{
                      color: typeColor,
                      borderColor: typeColor,
                    }}
                  >
                    {fm.type}
                  </span>
                  {fm.status && (
                    <span className="changelog-entry-status">
                      {STATUS_LABELS[fm.status] || fm.status}
                    </span>
                  )}
                </div>

                {fm.project && (
                  <div className="changelog-entry-project">{fm.project}</div>
                )}

                <h2 className="changelog-entry-title">
                  {fm.link ? (
                    <a
                      href={fm.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {fm.title}
                    </a>
                  ) : (
                    fm.title
                  )}
                </h2>

                <div
                  className="changelog-entry-body"
                  dangerouslySetInnerHTML={{ __html: node.html }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export const query = graphql`
  query ChangelogEntries {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        frontmatter {
          title
          date
          type
          link
          status
          project
        }
        html
        excerpt(pruneLength: 200)
      }
    }
  }
`

export default ChangelogPage
