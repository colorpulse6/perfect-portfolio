import React from "react"
import { SiBandcamp, SiSoundcloud, SiSpotify } from "react-icons/si"

export type IconPlatform = "soundcloud" | "spotify" | "bandcamp"
const MARKS = {
  soundcloud: { Icon: SiSoundcloud, color: "#ff5500" },
  spotify: { Icon: SiSpotify, color: "#1ed760" },
  bandcamp: { Icon: SiBandcamp, color: "#1da0c3" },
} as const

/** A platform's brand mark, decorative: the text beside it names the platform. */
export const PlatformIcon: React.FC<{ platform: IconPlatform }> = ({ platform }) => {
  const { Icon, color } = MARKS[platform]
  return <Icon className="platform-icon" data-platform={platform} color={color} aria-hidden="true" focusable="false" />
}
