import React, { useEffect, useRef, useState } from "react"
import { createStage } from "./engine/stage"
import { getStage, setStage } from "./cosmos"
import { useAtlasTopology } from "./useAtlasTopology"
import "./cosmos.css"

interface CosmosStageProps {
  /** Current route; "/" warms the stage in idle time, "/atlas" shows the Atlas. */
  path: string
}

/**
 * Mounts the one persistent WebGL canvas for the home-to-Atlas experience.
 * The layout renders this at a stable tree position on every route, so the
 * canvas and its context survive the "/" to "/atlas" route change. Renders
 * nothing on the server.
 */
const CosmosStage: React.FC<CosmosStageProps> = ({ path }) => {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const topology = useAtlasTopology()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !canvasRef.current) return
    const stage = createStage(canvasRef.current)
    setStage(stage)
    return () => {
      stage.dispose()
      setStage(null)
    }
  }, [mounted])

  useEffect(() => {
    if (mounted) getStage()?.setTopology(topology)
  }, [mounted, topology])

  useEffect(() => {
    if (mounted) getStage()?.setPath(path)
  }, [mounted, path])

  if (!mounted) return null
  return <canvas ref={canvasRef} className="cosmos-stage" aria-hidden="true" tabIndex={-1} />
}

export default CosmosStage
