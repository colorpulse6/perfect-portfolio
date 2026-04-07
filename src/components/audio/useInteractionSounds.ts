import { useRef, useCallback } from "react"
import { useAmbientAudio } from "./AmbientAudioProvider"
import { InteractionSounds, SoundName } from "./InteractionSounds"

export function useInteractionSounds(): (name: SoundName) => void {
  const audio = useAmbientAudio()
  const soundsRef = useRef<InteractionSounds | null>(null)

  const play = useCallback(
    (name: SoundName) => {
      if (!audio || audio.muted) return
      const ctx = audio.engine.getContext()
      if (!ctx) return

      if (!soundsRef.current) {
        soundsRef.current = new InteractionSounds(ctx)
      }
      soundsRef.current.play(name)
    },
    [audio]
  )

  return play
}
