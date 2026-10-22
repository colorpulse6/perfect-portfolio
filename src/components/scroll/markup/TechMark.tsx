import React from "react"
import { TECH_ICON } from "../../scroll/data/content"

export function TechMark({ name, icon, decorative = false }: { name: string; icon?: string; decorative?: boolean }) {
  const id = icon ?? TECH_ICON[name]
  if (!id) return null
  return <svg className="ti" role={decorative ? undefined : "img"} aria-label={decorative ? undefined : name} aria-hidden={decorative ? true : undefined} focusable="false"><title>{name}</title><use href={`#i-${id}`} /></svg>
}
