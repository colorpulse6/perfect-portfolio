import React from "react"
import SEO from "../components/seo"
import ScrollScenes from "../components/scroll/ScrollScenes"
import { useScrollData } from "../components/scroll/data/useScrollData"
import "../components/scroll/scroll.css"

const IndexPage: React.FC = () => {
  const data = useScrollData()
  return <>
    <SEO title="Software engineer and composer" pathname="/" />
    <ScrollScenes data={data} />
  </>
}

export default IndexPage
