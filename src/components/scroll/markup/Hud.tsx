import React from "react"
import { SOCIAL } from "../data/content"
import type { SceneItem } from "../data/types"
import { TechMark } from "./TechMark"

export function Hud({ scenes }: { scenes: SceneItem[] }) {
  return <>
    <header className="hud hud-top"><span className="dot" aria-hidden="true" />Nichalas Barnes <span className="sub">scroll scenes</span></header>
    <nav className="hud hud-social" aria-label="Elsewhere">{SOCIAL.map(item =>
      <a key={item.label} className={item.label === "Support" ? "support" : undefined} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label} title={item.label}><TechMark name={item.label} icon={item.icon} decorative />{item.label === "Support" && <span>Support</span>}</a>
    )}</nav>
    <nav className="hud hud-nav" aria-label="Scenes">{scenes.map(scene => <a key={scene.id} href={`#${scene.id}`}>{scene.label}</a>)}</nav>
  </>
}
