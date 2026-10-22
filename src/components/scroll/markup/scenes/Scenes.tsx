import React from "react"
import { SCENE_COPY, SOCIAL } from "../../data/content"
import type { AppItem, EssayItem, Letter, LogItem, SceneItem, ScrollData, StoryItem } from "../../data/types"
import { TechMark } from "../TechMark"
import { LetterBody } from "../LetterBody"

type Props = { data: ScrollData; scene: SceneItem }
function Scene({ scene, children }: { scene: SceneItem; children: React.ReactNode }) {
  return <section className="scene" id={scene.id} aria-label={scene.label}><div className="pin"><div className="inner">{children}</div></div></section>
}
function AppCards({ items, set }: { items: AppItem[]; set: string }) {
  return <ul className="ring stagger" data-step="0.03">{items.map((item, index) => <li key={item.name}>
    <a href={item.link} data-set={set} data-k={index}>
      <span className="thumb"><img src={item.image} alt="" loading="lazy" decoding="async" /></span>
      <strong>{item.name}</strong><span className="lab">{item.medium}</span>
      <span className="tech">{item.tech.map(name => <TechMark key={name} name={name} />)}</span>
      <p>{item.blurb}</p>{item.open && <span className="lab">{item.open}</span>}
    </a>
  </li>)}</ul>
}
function PieceCards({ items, set }: { items: (StoryItem | EssayItem | LogItem)[]; set: string }) {
  return <ul className="pieces stagger" data-step="0.03">{items.map((item, index) => <li key={item.title}>
    <a href={item.link} data-set={set} data-k={index}>
      {'image' in item ? <span className="thumb"><img src={item.image} alt="" loading="lazy" decoding="async" /></span> : <span className={`cover ${set === "writing" ? "fiction" : "log"}`}><b>{item.num}</b><span className="lab">{set === "writing" ? "Fiction" : 'meta' in item ? item.meta : ""}</span></span>}
      <strong>{item.title}</strong><span className="lab kind">{set === "writing" ? "Short fiction" : 'meta' in item ? item.meta : ""}</span>
    </a>
  </li>)}</ul>
}
export function HeroScene({ scene }: Props) { return <Scene scene={scene}><div className="hero"><h1>{SCENE_COPY.hero.headline}</h1><p className="tag">{SCENE_COPY.hero.tag}</p><p className="lead">{SCENE_COPY.hero.lead}</p><p className="hint"><span className="hint-line" aria-hidden="true" />Scroll to travel</p></div></Scene> }
export function AboutScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.about.headline}</h2><div className="bio">{data.bio.map((line, i) => <p key={i}>{line}</p>)}</div></Scene> }
export function ProjectsScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.projects.headline}</h2><AppCards items={data.projects} set="projects" /></Scene> }
export function ToolsScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.tools.headline}</h2><AppCards items={data.tools} set="tools" /></Scene> }
export function WritingScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.writing.headline}</h2><PieceCards items={data.stories} set="writing" /></Scene> }
export function EssaysScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.essays.headline}</h2><PieceCards items={data.essays} set="essays" /><div className="preview-list">{data.essays.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.excerpt}</p><a href={item.link}>Read on Medium</a></article>)}</div></Scene> }
function LetterArticle({ letter, index }: { letter: Letter; index: number }) {
  return <article className="issue" data-k={index} id={`issue-${letter.num}`}>
    <p className="lab issue-meta">{letter.meta}</p><h3 id={`issue-${letter.num}-title`}>{letter.title}</h3>
    <p className="issue-deck">{letter.excerpt}</p>
    <div className="issue-body" tabIndex={0} role="region" aria-labelledby={`issue-${letter.num}-title`}><LetterBody blocks={letter.blocks} /></div>
  </article>
}
export function NewsletterScene({ data, scene }: Props) { return <Scene scene={scene}>
  <h2>{SCENE_COPY.newsletter.headline}</h2>
  <p className="orbit-nav" role="group" aria-label="Orbit the letters"><button type="button" className="orbit-btn" data-orb="1" aria-label="Older issue">‹</button><span className="orbit-pos" id="orbit-pos">No. {data.letters[0]?.num} of {data.letters.length}</span><button type="button" className="orbit-btn" data-orb="-1" aria-label="Newer issue">›</button><span className="orbit-hint">sideways scroll or arrow keys</span></p>
  <ul className="pieces index stagger" data-step="0.012" aria-label="Every letter">{data.letters.map((letter, index) => <li key={letter.link}><a href={`#issue-${letter.num}`} data-set="newsletter" data-k={index}><span className="cover letter"><b>{letter.num}</b><span className="lab">Letter</span></span><strong>{letter.title}</strong><span className="lab kind">{letter.date}</span></a></li>)}</ul>
  <p className="vh" id="orbit-announce" aria-live="polite" aria-atomic="true" />
  <section className="reader" aria-label="Letters">{data.letters.map((letter, index) => <LetterArticle key={letter.link} letter={letter} index={index} />)}</section>
</Scene> }
export function ChangelogScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.changelog.headline}</h2><PieceCards items={data.changelog} set="changelog" /></Scene> }
export function WorkScene({ scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.work.headline}</h2><p className="lead">{SCENE_COPY.work.lead}</p><a className="pill" href={SCENE_COPY.work.link}>{SCENE_COPY.work.cta} <span aria-hidden="true">↗</span></a></Scene> }
export function ContactScene({ scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.contact.headline}</h2><p className="lead">{SCENE_COPY.contact.lead}</p><ul className="links stagger">{SOCIAL.slice(0,4).map(item => <li key={item.label}><a href={item.href}>{item.label}</a></li>)}</ul></Scene> }
export function AtlasScene({ scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.atlas.headline}</h2><p className="lead">{SCENE_COPY.atlas.lead}</p><p className="atlas-wrap"><a className="pill atlas" href={SCENE_COPY.atlas.link}>{SCENE_COPY.atlas.cta} <span aria-hidden="true">↗</span></a><span className="lab small">{SCENE_COPY.atlas.note}</span></p></Scene> }
