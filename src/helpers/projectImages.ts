// Shared project-screenshot resolution.
//
// `imgSrc` on a Project node is either a Cloudinary URL (used directly) or the
// name of a local asset that ships with the site. The projects page resolves a
// few of these locally via static imports; the atlas needs the same resolution
// for its panels, so the map + resolver live here and are shared by both.

import HoopItAppGif from "../images/hoop.it.app.gif"
import FireStoreGif from "../images/fire-store-gif.gif"
import GigZillaGif from "../images/Gigzilla.gif"
import MadScienceGif from "../images/mad-science-gif.gif"
import BrainAtlasGif from "../images/brain-atlas-spin.gif"
import ThrottleDashboard from "../images/throttle-dashboard.png"
import ElFormDocsGif from "../images/elform-docs-dark.gif"
import CerebroDashboard from "../images/cerebro-dashboard.png"
import CerebroMyceliumGif from "../images/cerebro-mycelium.gif"

/**
 * Projects whose primary screenshot ships locally (rather than as the Cloudinary
 * URL in `imgSrc`). Mirrors the always-local cases in Project.tsx so the projects
 * page and the atlas resolve screenshots identically. "Cerebro Mycelium" is an
 * atlas-only curated body and never appears on the projects page.
 */
export const LOCAL_PRIMARY_IMAGES: Record<string, string> = {
  "Brain Atlas": BrainAtlasGif,
  Throttle: ThrottleDashboard,
  "El Form": ElFormDocsGif,
  Cerebro: CerebroDashboard,
  "Cerebro Mycelium": CerebroMyceliumGif,
}

/** Projects that swap to an animated GIF on hover (projects page only). */
export const HOVER_IMAGES: Record<string, string> = {
  "Hoop.It.App": HoopItAppGif,
  "Fire Store": FireStoreGif,
  Gigzilla: GigZillaGif,
  "Mad Science": MadScienceGif,
}

/**
 * Resolve a project's primary display image: the local asset when one ships with
 * the site, otherwise the (Cloudinary) `imgSrc` URL.
 */
export function resolveProjectImage(name: string, imgSrc: string): string {
  return LOCAL_PRIMARY_IMAGES[name] || imgSrc
}
