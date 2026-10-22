import React, { useEffect, useRef } from "react"
import type { ScrollData } from "./data/types"
import { Hud } from "./markup/Hud"
import { TechSprite } from "./markup/TechSprite"
import { DetailDialog } from "./markup/DetailDialog"
import { HeroScene, AboutScene, ProjectsScene, ToolsScene, WritingScene, EssaysScene, NewsletterScene, ChangelogScene, WorkScene, ContactScene, AtlasScene } from "./markup/scenes/Scenes"

// Without JavaScript the scenes stack as a plain page: every heading, card and letter
// in flow. Inside <noscript>, so with scripts on it never applies and the scenes keep
// the prototype's fixed layering from the first paint.
const NO_SCRIPT_CSS = `
.ss .scene { height: auto; min-height: 100vh; }
.ss .pin { position: relative; opacity: 1; visibility: visible; pointer-events: auto; min-height: 100vh; }
.ss .ring, .ss .pieces { position: relative; display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; max-width: 980px; }
.ss .ring li, .ss .pieces li { position: relative; left: auto; top: auto; margin: 0; width: auto; visibility: visible; }
.ss #sky { display: none; }
.ss #newsletter .inner { max-height: none; }
.ss .reader { pointer-events: auto; max-height: none; }
.ss .issue[hidden] { display: flex; }
.ss .issue { margin-bottom: 32px; }
.ss .issue-body { max-height: none; overflow: visible; mask-image: none; -webkit-mask-image: none; }
.ss .hud { z-index: 5; }
.ss { font-size: max(11px, 1rem); background: #111; color: rgba(232, 236, 255, 0.96); }
`
const components = [HeroScene, AboutScene, ProjectsScene, ToolsScene, WritingScene, EssaysScene, NewsletterScene, ChangelogScene, WorkScene, ContactScene, AtlasScene]
const ScrollScenes = React.memo(function ScrollScenes({ data }: { data: ScrollData }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined
    import("./engine/createScrollScenes").then(({ createScrollScenes }) => {
      if (cancelled) return
      document.documentElement.classList.add("ss-on")
      try {
        dispose = createScrollScenes(root.current!, { data }).dispose
      } catch (error) {
        document.documentElement.classList.remove("ss-on")
        throw error
      }
    })
    return () => { cancelled = true; dispose?.() }
  }, [data])
  return <div ref={root} className="ss" data-ss-version="r14">
    <noscript dangerouslySetInnerHTML={{ __html: `<style>${NO_SCRIPT_CSS}</style>` }} />
    <canvas id="sky" aria-hidden="true" />
    <TechSprite />
    <Hud scenes={data.scenes} />
    <main id="scenes">{data.scenes.map((scene, index) => {
      const Component = components[index]
      return <Component key={scene.id} data={data} scene={scene} />
    })}</main>
    <DetailDialog />
    <p id="fallback" hidden />
  </div>
})
export default ScrollScenes
