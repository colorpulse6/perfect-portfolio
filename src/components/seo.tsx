/**
 * SEO component that queries for data with
 * Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import React from "react"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"

// Type for individual meta tag objects - using any to match react-helmet's flexible meta prop
type MetaTag = any

// Type for the GraphQL query result
interface SiteMetadataQuery {
  site: {
    siteMetadata: {
      title: string
      description: string
      author: string
    }
  }
}

// Define the props interface for the SEO component
interface SEOProps {
  /** Description for the page meta tag */
  description?: string
  /** Language code for the page */
  lang?: string
  /** Additional meta tags to include */
  meta?: MetaTag[]
  /** Title for the page */
  title: string
}

/**
 * SEO component that sets up page metadata using react-helmet
 * @param props - The component props
 * @returns JSX element for page metadata
 */
const SEO: React.FC<SEOProps> = ({
  description = "",
  lang = "en",
  meta = [],
  title,
}) => {
  const { site }: SiteMetadataQuery = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
          author
        }
      }
    }
  `)

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={defaultTitle ? `%s | ${defaultTitle}` : undefined}
      meta={[
        {
          name: "description",
          content: metaDescription,
        },
        {
          property: "og:title",
          content: title,
        },
        {
          property: "og:description",
          content: metaDescription,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          name: "twitter:card",
          content: "summary",
        },
        {
          name: "twitter:creator",
          content: site.siteMetadata?.author || "",
        },
        {
          name: "twitter:title",
          content: title,
        },
        {
          name: "twitter:description",
          content: metaDescription,
        },
      ].concat(meta)}
    />
  )
}

export default SEO
