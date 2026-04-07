import React, { useState } from "react"
import DomArtifacts, { FeaturedEntry } from "./DomArtifacts"

interface HomeSceneProps {
  featuredEntries?: FeaturedEntry[]
}

const HomeScene: React.FC<HomeSceneProps> = ({ featuredEntries = [] }) => {
  const [isClient, setIsClient] = useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  return (
    <DomArtifacts featuredEntries={featuredEntries} />
  )
}

export default HomeScene
