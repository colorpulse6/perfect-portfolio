import React from "react"
import { navigate } from "gatsby"
import SEO from "../components/seo"

/** Keep bookmarked experiment links useful during client-side navigation too. */
const ScrollRedirect: React.FC = () => {
  React.useEffect(() => {
    void navigate(`/${window.location.search}${window.location.hash}`, { replace: true })
  }, [])
  return <>
    <SEO title="Portfolio" pathname="/" meta={[{ name: "robots", content: "noindex, follow" }]} />
    <p><a href="/">Continue to the portfolio</a></p>
  </>
}

export default ScrollRedirect
