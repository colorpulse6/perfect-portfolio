import React from "react"
import { TECH_SPRITE } from "../techSprite.generated"

export function TechSprite() {
  return <span className="sprite" aria-hidden="true" dangerouslySetInnerHTML={{ __html: TECH_SPRITE }} />
}
