import React, { createContext, useContext, useRef, useEffect, useCallback, useState } from "react"
import { AmbientEngine } from "./AmbientEngine"

interface AmbientAudioContextValue {
  engine: AmbientEngine
  muted: boolean
  toggle: () => void
}

const AmbientAudioContext = createContext<AmbientAudioContextValue | null>(null)

export function useAmbientAudio(): AmbientAudioContextValue | null {
  return useContext(AmbientAudioContext)
}

interface Props {
  pagePath: string
  children: React.ReactNode
}

export const AmbientAudioProvider: React.FC<Props> = ({ pagePath, children }) => {
  const engineRef = useRef<AmbientEngine | null>(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    if (!engineRef.current && typeof window !== "undefined") {
      engineRef.current = new AmbientEngine()
      setMuted(engineRef.current.muted)
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    const initOnInteraction = () => {
      if (!engine.initialized) {
        engine.init()
      }
      engine.resume()
    }

    window.addEventListener("click", initOnInteraction, { once: false })
    window.addEventListener("keydown", initOnInteraction, { once: false })
    return () => {
      window.removeEventListener("click", initOnInteraction)
      window.removeEventListener("keydown", initOnInteraction)
    }
  }, [pagePath])

  const toggle = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    if (!engine.initialized) {
      engine.init()
    }
    engine.toggle()
    setMuted(engine.muted)
  }, [])

  const value: AmbientAudioContextValue = {
    engine: engineRef.current!,
    muted,
    toggle,
  }

  return (
    <AmbientAudioContext.Provider value={value}>
      {children}
    </AmbientAudioContext.Provider>
  )
}
