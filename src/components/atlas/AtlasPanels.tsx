/**
 * AtlasPanels — the "wraith" panel system. When you click an orb or a nav item,
 * a panel condenses out of cold fog over the blurred galaxy. Ported from the
 * prototype's `portfolio-panels-ghost.jsx`, made data-driven:
 *   - WProject reads detail straight off the `work` object (no WDETAIL map).
 *   - WChangelog / WWriting / WFiction take changelog / essays / fiction props.
 *   - WContact is a real Netlify Forms submit (AJAX, inline confirmation).
 *   - StoryReveal reuses the shared word-by-word reveal mechanics on full text.
 * The prototype's AtlasClusterPanel + Wormhole are not ported — the router never
 * routes to a cluster panel (clicking a hub warps into its solar system instead).
 *
 * This file is the thin router. Each panel lives in its own module under
 * `panels/` (with the fiction triplet under `panels/fiction/`) and the shared
 * Wraith shell under `shells/`.
 */
import React from "react"
import type { AtlasWork, AtlasDomain, FictionStory, EssayItem, ChangelogItem } from "./atlasShared"
import { WAbout } from "./panels/WAbout"
import { WProject } from "./panels/WProject"
import { WWriting } from "./panels/WWriting"
import { WChangelog } from "./panels/WChangelog"
import { WContact } from "./panels/WContact"
import { WFiction } from "./panels/fiction/WFiction"

export interface AtlasPanelState {
  type: "about" | "fiction" | "writing" | "changelog" | "contact" | "project"
  work?: AtlasWork
  domain?: AtlasDomain
}

export interface AtlasPanelRouterProps extends AtlasPanelState {
  fiction?: FictionStory[]
  essays?: EssayItem[]
  changelog?: ChangelogItem[]
  onClose: () => void
}

export function AtlasPanelRouter({
  type,
  work,
  domain,
  fiction,
  essays,
  changelog,
  onClose,
}: AtlasPanelRouterProps) {
  if (type === "about") return <WAbout onClose={onClose} />
  if (type === "fiction") return <WFiction fiction={fiction} onClose={onClose} />
  if (type === "writing") return <WWriting essays={essays} onClose={onClose} />
  if (type === "changelog") return <WChangelog changelog={changelog} onClose={onClose} />
  if (type === "contact") return <WContact onClose={onClose} />
  if (type === "project") return <WProject work={work} domain={domain} onClose={onClose} />
  return null
}
