import React, { useLayoutEffect, useRef } from "react"
import type { AtlasDomain, AtlasWork } from "./atlasShared"
import { isVideo } from "../../helpers/projectImages"
import { getStage, onStage } from "../cosmos/cosmos"
import { useCosmos } from "../cosmos/cosmosStore"

interface AtlasPreviewCardProps {
  workIndex: Map<string, { work: AtlasWork; domain: AtlasDomain }>
  fictionCount: number
}

/**
 * Hover preview for a project star: its media (videos play muted while
 * hovered, as in the project rail), title, medium and status. The stage
 * positions it next to the star each frame.
 */
export function AtlasPreviewCard({ workIndex, fictionCount }: AtlasPreviewCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const hover = useCosmos((s) => s.hover)
  const panelOpen = useCosmos((s) => s.panelOpen)

  useLayoutEffect(() => {
    const el = ref.current
    const off = onStage((stage) => stage.registerPreview(el))
    return () => {
      off()
      getStage()?.registerPreview(null)
    }
  }, [])

  const hit = hover && hover.kind === "work" ? workIndex.get(hover.id) : null
  const fiction = hover && hover.kind === "fiction"
  const visible = !panelOpen && (!!hit || fiction)
  const media = hit?.work.media || null

  return (
    <div ref={ref} className="cosmos-preview" data-visible={visible ? "true" : "false"} aria-hidden="true">
      {hit && (
        <>
          {media && (
            <div className="cosmos-preview__media">
              {isVideo(media) ? (
                <video src={media} autoPlay loop muted playsInline />
              ) : (
                <img src={media} alt="" />
              )}
            </div>
          )}
          <div className="cosmos-preview__title">{hit.work.t}</div>
          <div className="cosmos-preview__meta">
            {(hit.work.medium || hit.domain.label).toUpperCase()} · {(hit.work.status || "released").replace("-", " ").toUpperCase()}
          </div>
          {hit.work.meta && <div className="cosmos-preview__body">{hit.work.meta}</div>}
          <div className="cosmos-preview__hint">CLICK TO OPEN</div>
        </>
      )}
      {fiction && (
        <>
          <div className="cosmos-preview__title">Fiction</div>
          <div className="cosmos-preview__meta">{fictionCount} STORIES</div>
          <div className="cosmos-preview__hint">CLICK TO READ</div>
        </>
      )}
    </div>
  )
}
