// Shared project-media resolution.
//
// Animated previews ship as small MP4 clips (converted from the original GIFs);
// static screenshots ship locally or come from Cloudinary (imgSrc). The maps +
// resolvers live here and are shared by the projects page and the atlas.

import ThrottleDashboard from "../images/throttle-dashboard.png"
import CerebroDashboard from "../images/cerebro-dashboard.png"
import PolisAtlasImg from "../images/polis-atlas.jpg"
import PolisAtlasVid from "../images/polis-atlas.mp4"
import BrainAtlasVid from "../images/brain-atlas-spin.mp4"
import ElFormVid from "../images/elform-docs-dark.mp4"
import CerebroMyceliumVid from "../images/cerebro-mycelium.mp4"
import HoopVid from "../images/hoop.it.app.mp4"
import FireStoreVid from "../images/fire-store.mp4"
import GigzillaVid from "../images/gigzilla.mp4"
import MadScienceVid from "../images/mad-science.mp4"

/** Static local primary screenshots (rendered as <img>). */
export const LOCAL_PRIMARY_IMAGES: Record<string, string> = {
  Throttle: ThrottleDashboard,
  Cerebro: CerebroDashboard,
  "Polis Atlas": PolisAtlasImg,
}

/** Always-animated primary clips (rendered as an autoplaying muted <video>). */
export const PRIMARY_VIDEOS: Record<string, string> = {
  "Brain Atlas": BrainAtlasVid,
  "El Form": ElFormVid,
  "Cerebro Mycelium": CerebroMyceliumVid,
  "Polis Atlas": PolisAtlasVid,
}

/** Animated clips shown on hover (poster = the project's static screenshot). */
export const HOVER_VIDEOS: Record<string, string> = {
  "Hoop.It.App": HoopVid,
  "Fire Store": FireStoreVid,
  Gigzilla: GigzillaVid,
  "Mad Science": MadScienceVid,
}

/** True if a media URL is a video clip rather than an image. */
export const isVideo = (src: string): boolean => /\.(mp4|webm)$/i.test(src)

/**
 * Resolve a project's primary display media: an animated clip or local image
 * when one ships with the site, otherwise the (Cloudinary) imgSrc URL. Consumers
 * should render <video> when isVideo() is true.
 */
export function resolveProjectMedia(name: string, imgSrc: string): string {
  return PRIMARY_VIDEOS[name] || LOCAL_PRIMARY_IMAGES[name] || imgSrc
}
