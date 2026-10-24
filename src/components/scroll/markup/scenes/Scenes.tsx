import React from "react"
import { ABOUT_FACTS, CARD_LINE, SCENE_COPY, SOCIAL } from "../../data/content"
import type { AppItem, EssayItem, Letter, LogItem, SceneItem, ScrollData, StoryItem } from "../../data/types"
import { TechMark } from "../TechMark"
import { LetterBody } from "../LetterBody"

// The markup is the prototype's (index.html, r14) node for node: the engine finds
// its pins, stagger groups (with their data-step), cards (data-set, data-k) and the
// reader by this structure, so classes, order and counts must not drift.
type Props = { data: ScrollData; scene: SceneItem }
function Scene({ scene, inner = "inner", children }: { scene: SceneItem; inner?: string; children: React.ReactNode }) {
  return <section className="scene" id={scene.id} aria-label={scene.label}><div className="pin"><div className={inner}>{children}</div></div></section>
}
function AppCards({ items, set, step }: { items: AppItem[]; set: string; step: string }) {
  return <ul className="ring stagger" data-step={step}>{items.map((item, index) => <li key={item.name}>
    <a href={item.link} data-set={set} data-k={index}>
      <span className="thumb"><img src={item.image} alt="" decoding="async" /></span>
      <strong>{item.name}</strong><span className="lab">{item.medium}</span>
      <span className="tech">{item.tech.map(name => <TechMark key={name} name={name} />)}</span>
      <p>{CARD_LINE[item.name] ?? item.blurb}</p>
    </a>
  </li>)}</ul>
}
// the line under a piece's title: "Short fiction", an essay's date, a log entry's kind and medium
const parts = (meta: string) => meta.split(" · ")
function PieceCards({ items, set, step }: { items: (StoryItem | EssayItem | LogItem)[]; set: "writing" | "essays" | "changelog"; step: string }) {
  return <ul className="pieces stagger" data-step={step}>{items.map((item, index) => <li key={item.title}>
    <a href={item.link} data-set={set} data-k={index}>
      {'image' in item
        ? <span className="thumb"><img src={item.image} alt="" decoding="async" /></span>
        : <span className={`cover ${set === "writing" ? "fiction" : "log"}`}><b>{item.num}</b><span className="lab">{'kindLabel' in item ? item.kindLabel : "Fiction"}</span></span>}
      <strong>{item.title}</strong>
      <span className="lab kind">{set === "writing" ? "Short fiction" : 'meta' in item ? (set === "essays" ? parts(item.meta).slice(-1)[0] : parts(item.meta).slice(0, -1).join(" · ")) : ""}</span>
    </a>
  </li>)}</ul>
}
export function HeroScene({ scene }: Props) { return <Scene scene={scene} inner="inner hero"><h1>{SCENE_COPY.hero.headline}</h1><p className="tag">{SCENE_COPY.hero.tag}</p><p className="lead">{SCENE_COPY.hero.lead}</p><p className="hint"><span className="hint-line" aria-hidden="true" />Scroll to travel</p></Scene> }
export function AboutScene({ data, scene }: Props) {
  return <Scene scene={scene}><h2>{SCENE_COPY.about.headline}</h2><div className="bio">{data.bio.map((line, i) => <p key={i}>{line}</p>)}</div>
    <ul className="facts stagger" data-step="0.04">{ABOUT_FACTS.map(fact => <li key={fact.label}><span className="lab">{fact.label}</span>{fact.text}</li>)}</ul>
  </Scene>
}
export function ProjectsScene({ data, scene }: Props) { return <Scene scene={scene} inner="inner project-inner">
  <h2>{SCENE_COPY.projects.headline}</h2>
  <div className="project-stage" role="region" aria-roledescription="carousel" aria-label="Projects">
    <svg className="project-track" aria-hidden="true"><path className="back" /><path className="front" /></svg>
    <div className="project-globe" aria-hidden="true" />
    {data.projects.map((item, index) => <button key={item.name} className="project-moon" type="button" data-project={index} aria-label={`Show ${item.name}, ${index + 1} of ${data.projects.length}`} aria-current={index === 0 ? "true" : "false"}>
      <span className="project-orb"><img src={item.image} alt="" decoding="async" /><span className="project-dim" /></span><span className="project-tag">{item.name}</span>
    </button>)}
    <section className="project-panel" aria-label="Active project">
      {data.projects.map((item, index) => <article key={item.name} className="project-leaf" data-project-leaf={index} hidden={index !== 0} aria-labelledby={`project-title-${index}`}>
        <div className="project-media"><img src={item.image} alt="" decoding="async" />{item.video && <video muted loop playsInline preload="none" aria-hidden="true" data-video={item.video} />}</div>
        <div className="project-more"><h3 id={`project-title-${index}`}>{item.name}</h3><span className="lab">{item.medium}</span><p>{item.blurb}</p>
          <ul className="project-tech" aria-label="Built with">{item.tech.map(name => <li key={name}><TechMark name={name} decorative />{name}</li>)}</ul>
          <p className="project-actions">{item.link && <a className="pill" href={item.link} target="_blank" rel="noopener noreferrer">{item.name === "Cerebro" ? "Download" : "Live"}<span aria-hidden="true">↗</span></a>}{item.github && <a className="pill secondary" href={item.github} target="_blank" rel="noopener noreferrer"><TechMark name="GitHub" icon="github" decorative />GitHub</a>}{item.name === "Cerebro" && <a className="pill secondary" href="https://trycerebro.com/" target="_blank" rel="noopener noreferrer">Site<span aria-hidden="true">↗</span></a>}</p>
        </div>
      </article>)}
    </section>
  </div>
  <div className="project-controls" role="group" aria-label="Turn the projects"><button type="button" data-project-step="-1" aria-label="Previous project">‹</button><span id="project-count">1 of {data.projects.length}</span><button type="button" data-project-step="1" aria-label="Next project">›</button><span className="lab">sideways scroll or arrow keys</span></div>
</Scene> }
export function ToolsScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.tools.headline}</h2><AppCards items={data.tools} set="tools" step="0.03" /></Scene> }
export function WritingScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.writing.headline}</h2><PieceCards items={data.stories} set="writing" step="0.02" /></Scene> }
export function EssaysScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.essays.headline}</h2><PieceCards items={data.essays} set="essays" step="0.03" /></Scene> }
// the letter's week, from its link (/newsletter/2026-W42/): the article carries it as data-week
const weekOf = (letter: Letter) => letter.link.split("/").filter(Boolean).pop()
function LetterArticle({ letter, index }: { letter: Letter; index: number }) {
  return <article className="issue" data-week={weekOf(letter)} id={`issue-${letter.num}`} data-k={index} hidden={index > 0}>
    <p className="lab issue-meta">{letter.meta}</p><h3 id={`issue-${letter.num}-title`}>{letter.title}</h3>
    <p className="issue-deck">{letter.excerpt}</p>
    <div className="issue-body" tabIndex={0} role="region" aria-labelledby={`issue-${letter.num}-title`}><LetterBody blocks={letter.blocks} /></div>
  </article>
}
export function NewsletterScene({ data, scene }: Props) { return <Scene scene={scene}>
  <h2>{SCENE_COPY.newsletter.headline}</h2>
  <p className="orbit-nav" role="group" aria-label="Orbit the letters"><button type="button" className="orbit-btn" data-orb="1" aria-label="Older issue" title="Older issue (left arrow)">‹</button><span className="orbit-pos" id="orbit-pos">No. {data.letters[0]?.num} of {data.letters.length}</span><button type="button" className="orbit-btn" data-orb="-1" aria-label="Newer issue" title="Newer issue (right arrow)">›</button><span className="orbit-hint">sideways scroll or arrow keys</span></p>
  <ul className="pieces index stagger" data-step="0.012" aria-label="Every letter">{data.letters.map((letter, index) => <li key={letter.link}><a href={letter.link} data-set="newsletter" data-k={index}><span className="cover letter"><b>{letter.num}</b><span className="lab">Letter</span></span><strong>{letter.title}</strong><span className="lab kind">{letter.date}</span></a></li>)}</ul>
  <section className="reader" aria-label="The letter at the front">{data.letters.map((letter, index) => <LetterArticle key={letter.link} letter={letter} index={index} />)}</section>
</Scene> }
export function ChangelogScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.changelog.headline}</h2><PieceCards items={data.changelog} set="changelog" step="0.03" /></Scene> }
export function WorkScene({ scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.work.headline}</h2><p className="lead">{SCENE_COPY.work.lead}</p><a className="pill" href={SCENE_COPY.work.link}>{SCENE_COPY.work.cta} <span aria-hidden="true">↗</span></a></Scene> }
// the contact lead names the address; the address is a mail link, as in the prototype
function ContactLead() {
  const lead = SCENE_COPY.contact.lead, email = SCENE_COPY.contact.email, at = lead.indexOf(email)
  if (at < 0) return <p className="lead">{lead}</p>
  return <p className="lead">{lead.slice(0, at)}<a href={`mailto:${email}`}>{email}</a>{lead.slice(at + email.length)}</p>
}
export function ContactScene({ scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.contact.headline}</h2><ContactLead /><ul className="links stagger" data-step="0.03">{SOCIAL.slice(0, 4).map(item => <li key={item.label}><a href={item.href}>{item.label}</a></li>)}</ul></Scene> }
export function AtlasScene({ scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.atlas.headline}</h2><p className="lead">{SCENE_COPY.atlas.lead}</p><p className="atlas-wrap"><a className="pill atlas" href={SCENE_COPY.atlas.link}>{SCENE_COPY.atlas.cta} <span aria-hidden="true">↗</span></a><span className="lab small">{SCENE_COPY.atlas.note}</span></p></Scene> }
