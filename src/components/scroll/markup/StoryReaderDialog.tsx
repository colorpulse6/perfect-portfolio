import React from "react"
// Filled from the active story when the reader opens, so the 16 stories are not shipped twice.
export function StoryReaderDialog() {
  return <section id="story-reader" className="story-reader" role="dialog" aria-modal="true" aria-labelledby="story-reader-title" hidden>
    <div className="story-reader-bar">
      <span className="lab">Fiction <span id="story-reader-num" /></span>
      <span className="story-reader-nav">
        <button type="button" id="story-reader-prev" aria-label="Previous story">‹</button>
        <span id="story-reader-count" className="lab" />
        <button type="button" id="story-reader-next" aria-label="Next story">›</button>
      </span>
      <button type="button" id="story-reader-close" className="story-reader-close">Close</button>
    </div>
    <div className="story-reader-progress" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><span /></div>
    <div className="story-reader-page" id="story-reader-page" tabIndex={0}>
      <article className="story-reader-column">
        <h2 id="story-reader-title" />
        <div className="story-reader-text" id="story-reader-text" />
      </article>
    </div>
  </section>
}
