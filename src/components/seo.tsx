/**
 * SEO component (react-helmet). Emits title, description, canonical, Open Graph,
 * and Twitter tags. Pass `pathname` (from the page's `location`) so canonical /
 * og:url are absolute.
 */
import React from "react"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"
import { buildGraph, JsonLd } from "../helpers/structuredData"

// Type for individual meta tag objects - using any to match react-helmet's flexible meta prop
type MetaTag = any

interface SiteMetadataQuery {
  site: {
    siteMetadata: {
      title: string
      description: string
      author: string
      siteUrl: string
    }
  }
}

interface SEOProps {
  /** Description for the page meta tag */
  description?: string
  /** Language code for the page */
  lang?: string
  /** Additional meta tags to include */
  meta?: MetaTag[]
  /** Title for the page */
  title: string
  /** Page pathname (from location) for canonical / og:url */
  pathname?: string
  /** Optional path (under siteUrl) to a social image; defaults to /og-image.png */
  image?: string
  /** Extra JSON-LD @graph nodes for this page (Person + WebSite are always emitted). */
  schema?: JsonLd[]
}

const SEO: React.FC<SEOProps> = ({
  description = "",
  lang = "en",
  meta = [],
  title,
  pathname,
  image,
  schema,
}) => {
  const { site }: SiteMetadataQuery = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
          author
          siteUrl
        }
      }
    }
  `)

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title
  const siteUrl = (site.siteMetadata?.siteUrl || "").replace(/\/+$/, "")
  const url = pathname ? `${siteUrl}${pathname}` : siteUrl
  const ogImage = `${siteUrl}${image || "/og-image.png"}`
  const jsonLd = buildGraph(schema)

  return (
    <Helmet
      htmlAttributes={{ lang }}
      title={title}
      titleTemplate={defaultTitle ? `%s | ${defaultTitle}` : undefined}
      link={[{ rel: "canonical", href: url }]}
      script={[
        { type: "application/ld+json", innerHTML: JSON.stringify(jsonLd) },
      ]}
      meta={[
        { name: "description", content: metaDescription },
        { property: "og:title", content: title },
        { property: "og:description", content: metaDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: defaultTitle },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:creator", content: site.siteMetadata?.author || "" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: metaDescription },
        { name: "twitter:image", content: ogImage },
      ].concat(meta)}
    />
  )
}

export default SEO
