import React from "react"
import SEO from "../components/seo"
import ScrollScenes from "../components/scroll/ScrollScenes"
import { useScrollData } from "../components/scroll/data/useScrollData"
import "../components/scroll/scroll.css"

const ScrollPage: React.FC = () => {
  const data = useScrollData()
  return <>
    <SEO title="scroll" pathname="/scroll/" meta={[{ name: "robots", content: "noindex, nofollow" }]} />
    <ScrollScenes data={data} />
  </>
}

export default ScrollPage
