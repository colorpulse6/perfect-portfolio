import React from "react"
import Layout from "../components/layout"
import SEO from "../components/seo"

/**
 * 404 Not Found page component
 * @returns JSX element for the 404 error page
 */
const NotFoundPage: React.FC = () => (
  <Layout>
    <SEO title="404: Not found" />
    <h1>404: Not Found</h1>
    <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
  </Layout>
)

export default NotFoundPage
