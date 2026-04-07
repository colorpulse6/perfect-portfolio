import React, { useState, Suspense, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import ParticleField from "./ParticleField"
import { useCursorPosition } from "./useCursorPosition"
import { resolveTheme, ParticleTheme } from "./particleThemes"

interface SceneContentProps {
  theme: ParticleTheme
}

const SceneContent: React.FC<SceneContentProps> = ({ theme }) => {
  const cursorRef = useCursorPosition()
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 550

  return (
    <>
      <ParticleField
        cursorRef={cursorRef}
        count={isMobile ? 350 : 900}
        theme={theme}
      />
      {!isMobile && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={0.8}
          />
        </EffectComposer>
      )}
    </>
  )
}

function hasWebGL(): boolean {
  if (typeof window === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"))
  } catch {
    return false
  }
}

interface ParticleBackgroundProps {
  pagePath?: string
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  pagePath = "/",
}) => {
  const [isClient, setIsClient] = useState(false)
  const [webglAvailable, setWebglAvailable] = useState(true)

  const theme = useMemo(() => resolveTheme(pagePath), [pagePath])

  React.useEffect(() => {
    setIsClient(true)
    setWebglAvailable(hasWebGL())
  }, [])

  if (!isClient || !webglAvailable) return null

  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
      camera={{ position: [0, 0, 8], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <SceneContent theme={theme} />
      </Suspense>
    </Canvas>
  )
}

export default ParticleBackground
