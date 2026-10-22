import React, { useEffect } from "react"
import type { ScrollData } from "./data/types"
import { Hud } from "./markup/Hud"
import { TechSprite } from "./markup/TechSprite"
import { DetailDialog } from "./markup/DetailDialog"
import { HeroScene, AboutScene, ProjectsScene, ToolsScene, WritingScene, EssaysScene, NewsletterScene, ChangelogScene, WorkScene, ContactScene, AtlasScene } from "./markup/scenes/Scenes"

const components = [HeroScene, AboutScene, ProjectsScene, ToolsScene, WritingScene, EssaysScene, NewsletterScene, ChangelogScene, WorkScene, ContactScene, AtlasScene]
const ScrollScenes = React.memo(function ScrollScenes({ data }: { data: ScrollData }) {
  useEffect(() => {
    let cancelled = false
    // E2 will dynamically import the engine here and check cancelled before boot.
    return () => { cancelled = true; void cancelled }
  }, [])
  return <div className="ss" data-ss-version="r14-shell">
    <canvas id="sky" aria-hidden="true" />
    <TechSprite />
    <Hud scenes={data.scenes} />
    <main id="scenes">{data.scenes.map((scene, index) => {
      const Component = components[index]
      return <Component key={scene.id} data={data} scene={scene} />
    })}</main>
    <DetailDialog />
  </div>
})
export default ScrollScenes
