import { useCallback } from "react"
import { SoundName } from "./InteractionSounds"

export function useInteractionSounds(): (name: SoundName) => void {
  return useCallback((_name: SoundName) => {}, [])
}
