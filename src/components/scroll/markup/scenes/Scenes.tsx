import React from "react"
import { ABOUT_FACTS, CARD_LINE, COLORPULSE_ALBUMS, RELEASES, SCENE_COPY, SOCIAL } from "../../data/content"
import { formatTextContent } from "../../../../helpers/wordReveal"
import priaprizmPhoto from "../../images/priaprizm.jpg"
import colorpulsePhoto from "../../images/colorpulse.jpg"
import hungarianSpa from "../../images/alexs-hand-hungarian-spa.jpg"
import katatak from "../../images/alexs-hand-katatak.jpg"
import kunstler from "../../images/alexs-hand-kunstler-scheisse.jpg"
import goblinsz from "../../images/alexs-hand-goblinsz.jpg"
import roaches from "../../images/alexs-hand-the-roaches.jpg"
import cancumbia from "../../images/alexs-hand-cancumbia.jpg"
import albatross from "../../images/alexs-hand-an-albatross-around-the-neck.jpg"
import cat from "../../images/alexs-hand-this-cat-is-a-genius.jpg"
import psychosis from "../../images/alexs-hand-madame-psychosis.jpg"
import type { AppItem, Letter, LogItem, SceneItem, ScrollData } from "../../data/types"
import { TechMark } from "../TechMark"
import { LetterBody } from "../LetterBody"
import { useNetlifyForm } from "../../../../helpers/useNetlifyForm"

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
// the line under a log entry's title names its kind and medium
const parts = (meta: string) => meta.split(" · ")
function PieceCards({ items, step }: { items: LogItem[]; step: string }) {
  return <ul className="pieces stagger" data-step={step}>{items.map((item, index) => <li key={item.title}>
    <a href={item.link} data-set="changelog" data-k={index}>
      <span className="cover log"><b>{item.num}</b><span className="lab">{item.kindLabel}</span></span>
      <strong>{item.title}</strong>
      <span className="lab kind">{parts(item.meta).slice(0, -1).join(" · ")}</span>
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
const releaseCovers: Record<string, string> = {
  "alexs-hand-hungarian-spa.jpg": hungarianSpa, "alexs-hand-katatak.jpg": katatak,
  "alexs-hand-kunstler-scheisse.jpg": kunstler, "alexs-hand-goblinsz.jpg": goblinsz,
  "alexs-hand-the-roaches.jpg": roaches, "alexs-hand-cancumbia.jpg": cancumbia,
  "alexs-hand-an-albatross-around-the-neck.jpg": albatross,
  "alexs-hand-this-cat-is-a-genius.jpg": cat,
  "alexs-hand-madame-psychosis.jpg": psychosis,
}
export function CreativeScene({ data, scene }: Props) { return <Scene scene={scene} inner="inner creative-inner">
  <h2>{SCENE_COPY.creative.headline}</h2>
  <div className="creative-switch" role="tablist" aria-label="Creative worlds">
    <button type="button" role="tab" id="creative-tab-stories" aria-controls="creative-stories" aria-selected="true" tabIndex={0} data-creative-world="stories">Stories</button>
    <button type="button" role="tab" id="creative-tab-music" aria-controls="creative-music" aria-selected="false" tabIndex={-1} data-creative-world="music">Music</button>
  </div>
  <div className="creative-stage">
    <div id="creative-stories" className="creative-world stories-world" role="region" aria-label="Stories" aria-labelledby="creative-tab-stories">
      <h3>Stories</h3>
      <div className="story-workspace">
        <nav className="story-index" aria-label="Choose a story">
          {data.stories.map((item, index) => <button className="story-choice" type="button" key={item.link} data-story={index} aria-current={index === 0 ? "true" : "false"}><span>{item.num}</span><span>{item.title}</span></button>)}
        </nav>
        <section className="story-panel" aria-label="Active story">
          {data.stories.map((item, index) => <article className="story-leaf" key={item.link} data-story-leaf={index} hidden={index !== 0}>
            <header className="story-header"><span className="story-number">{item.num}</span><div><span className="lab">Fiction</span><h4 id={`creative-story-title-${index}`}>{item.title}</h4></div><button type="button" className="story-expand" data-story-expand aria-label={`Read ${item.title} full screen`}>Full screen <span aria-hidden="true">⤢</span></button></header>
            <div className="story-text" tabIndex={0} role="region" aria-labelledby={`creative-story-title-${index}`} dangerouslySetInnerHTML={{ __html: formatTextContent(item.content) }} />
          </article>)}
          <div className="story-progress" role="progressbar" aria-label="Story reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><span /></div>
        </section>
      </div>
      <div className="creative-controls" role="group" aria-label="Turn stories"><button type="button" data-creative-step="-1" data-creative-target="stories" aria-label="Previous story">‹</button><span id="story-count">1 of {data.stories.length}</span><button type="button" data-creative-step="1" data-creative-target="stories" aria-label="Next story">›</button></div>
    </div>
    <div id="creative-music" className="creative-world music-world" role="region" aria-label="Music" aria-labelledby="creative-tab-music">
      <h3>Music</h3>
      <div className="music-tabs" role="tablist" aria-label="Music projects">
        <button type="button" role="tab" id="music-tab-alex" aria-controls="music-panel-alex" aria-selected="true" tabIndex={0} data-music-project="alex">Alex&apos;s Hand</button>
        <button type="button" role="tab" id="music-tab-colorpulse" aria-controls="music-panel-colorpulse" aria-selected="false" tabIndex={-1} data-music-project="colorpulse">Colorpulse</button>
        <button type="button" role="tab" id="music-tab-priaprizm" aria-controls="music-panel-priaprizm" aria-selected="false" tabIndex={-1} data-music-project="priaprizm">Priaprizm</button>
      </div>
      <section id="music-panel-alex" className="music-project" role="tabpanel" aria-labelledby="music-tab-alex">
        <p className="creative-deck">Alex&apos;s Hand was a ten-piece ensemble founded in 2011 by Kellen Mills and Nic Barnes. We toured the US and Europe through 2019. Hungarian Spa was our final album.</p>
        <div className="record-panel" aria-label="Active album">{RELEASES.map((release, index) => <article className="record-leaf" key={release.title} data-record-leaf={index} hidden={index !== 0}>
          <div className="record-art"><span className="record-disc" aria-hidden="true"><span className="vinyl-grooves" /><span className="vinyl-label"><img src={releaseCovers[release.cover]} alt="" decoding="async" /></span><span className="vinyl-hole" /></span><span className="record-sleeve"><img src={releaseCovers[release.cover]} alt={`${release.title} album cover`} decoding="async" /></span></div>
          <div className="record-copy"><span className="lab">{release.date} · {release.tracks} tracks</span><h4>{release.title}</h4><p>{release.description}</p><div className="record-links"><a href={release.link} target="_blank" rel="noopener noreferrer">Listen on Bandcamp <span aria-hidden="true">↗</span></a><a className="music-pill" href="https://open.spotify.com/artist/0iFemeRah3zjZQoctmYf2v" target="_blank" rel="noopener noreferrer">Spotify</a></div></div>
        </article>)}</div>
        <div className="creative-controls" role="group" aria-label="Turn Alex's Hand albums"><button type="button" data-creative-step="-1" data-creative-target="music" aria-label="Previous album">‹</button><span id="record-count">1 of {RELEASES.length}</span><button type="button" data-creative-step="1" data-creative-target="music" aria-label="Next album">›</button></div>
      </section>
      <section id="music-panel-colorpulse" className="music-project" role="tabpanel" aria-labelledby="music-tab-colorpulse" hidden>
        <div className="tape-panel" aria-label="Active Colorpulse album">{COLORPULSE_ALBUMS.map((album, index) => <article className="tape-leaf" key={album.title} data-tape-leaf={index} hidden={index !== 0}>
          <div className="tape-art" aria-hidden="true" style={{ "--tape-photo": `url(${colorpulsePhoto})` } as React.CSSProperties}><span>Colorpulse</span><strong>{album.title}</strong><i /></div><h4>{album.title}</h4><a href={album.link} target="_blank" rel="noopener noreferrer">Listen on SoundCloud <span aria-hidden="true">↗</span></a>
        </article>)}</div>
        <a className="music-pill" href="https://soundcloud.com/colorpulse" target="_blank" rel="noopener noreferrer">Colorpulse on SoundCloud</a>
        <div className="creative-controls" role="group" aria-label="Turn Colorpulse albums"><button type="button" data-creative-step="-1" data-creative-target="music" aria-label="Previous Colorpulse album">‹</button><span id="tape-count">1 of {COLORPULSE_ALBUMS.length}</span><button type="button" data-creative-step="1" data-creative-target="music" aria-label="Next Colorpulse album">›</button></div>
      </section>
      <section id="music-panel-priaprizm" className="music-project" role="tabpanel" aria-labelledby="music-tab-priaprizm" hidden>
        <div className="priaprizm-card"><img src={priaprizmPhoto} alt="Priaprizm playing a show, the band caught mid-pile on a bar floor" decoding="async" loading="lazy" /><span className="lab">Music project</span><h4>Priaprizm</h4><p>Seattle, Washington</p><a href="https://priaprizm.bandcamp.com" target="_blank" rel="noopener noreferrer">Listen on Bandcamp <span aria-hidden="true">↗</span></a></div>
      </section>
    </div>
  </div>
</Scene> }
export function EssaysScene({ data, scene }: Props) { return <Scene scene={scene} inner="inner essays-inner"><h2>{SCENE_COPY.essays.headline}</h2><div className="essay-spread stagger" data-step="0.05">{data.essays.map(item => <article className="essay-card" key={item.link}>
  <img src={item.image} alt="" decoding="async" /><div className="essay-copy"><span className="lab">{item.meta}</span><h3>{item.title}</h3><p>{item.excerpt}</p><a href={item.link} target="_blank" rel="noopener noreferrer">Read on Medium <span aria-hidden="true">↗</span></a></div>
</article>)}</div></Scene> }
// the letter's week, from its link (#newsletter-2026-W42): the article carries it as data-week
const weekOf = (letter: Letter) => letter.link.replace(/^#newsletter-/, "")
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
export function ChangelogScene({ data, scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.changelog.headline}</h2><PieceCards items={data.changelog} step="0.03" /></Scene> }
export function WorkScene({ scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.work.headline}</h2><p className="lead">{SCENE_COPY.work.lead}</p><a className="pill" href={SCENE_COPY.work.link}>{SCENE_COPY.work.cta} <span aria-hidden="true">↗</span></a></Scene> }
export function ContactScene({ scene }: Props) {
  const { form, setForm, status, submit } = useNetlifyForm()
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); void submit() }
  return <Scene scene={scene}><h2>{SCENE_COPY.contact.headline}</h2><p className="lead">{SCENE_COPY.contact.lead}</p>
    {status === "sent" ? <p className="contact-status" role="status" aria-live="polite">Message sent. I will get back to you soon.</p> :
      <form className="contact-form" name="contact" method="POST" onSubmit={handleSubmit}>
        <input type="hidden" name="form-name" value="contact" /><input type="hidden" name="bot-field" />
        <label htmlFor="scroll-contact-name">Your Name<input id="scroll-contact-name" name="name" type="text" autoComplete="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
        <label htmlFor="scroll-contact-email">Your Email<input id="scroll-contact-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></label>
        <label className="contact-message" htmlFor="scroll-contact-message">Message<textarea id="scroll-contact-message" name="message" rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></label>
        <p className={`contact-status${status === "error" ? " error" : ""}`} role="status" aria-live="polite">{status === "sending" ? "Sending..." : status === "error" ? "Something went wrong. Your message is still here. Please try again." : ""}</p>
        <button className="pill" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending..." : "Send message"}</button>
      </form>}
    <ul className="links stagger" data-step="0.03">{SOCIAL.slice(0, 4).map(item => <li key={item.label}><a href={item.href}>{item.label}</a></li>)}</ul>
  </Scene>
}
export function AtlasScene({ scene }: Props) { return <Scene scene={scene}><h2>{SCENE_COPY.atlas.headline}</h2><p className="lead">{SCENE_COPY.atlas.lead}</p><p className="atlas-wrap"><a className="pill atlas" href={SCENE_COPY.atlas.link}>{SCENE_COPY.atlas.cta} <span aria-hidden="true">↗</span></a><span className="lab small">{SCENE_COPY.atlas.note}</span></p></Scene> }
