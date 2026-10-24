import React from "react"
export function DetailDialog() {
  return <section id="detail" className="detail" role="dialog" aria-modal="true" aria-labelledby="detail-title" hidden>
    <div className="detail-card" data-ss-owned="true">
      <figure className="detail-media"><img id="detail-img" alt="" /><div className="detail-type" id="detail-type" hidden><b id="detail-type-num" /><span className="lab" id="detail-type-kind" /></div></figure>
      <div className="detail-body">
        <span className="lab" id="detail-meta" /><h2 id="detail-title" /><p className="lead" id="detail-blurb" />
        <ul className="detail-tech" id="detail-tech" aria-label="Built with" hidden />
        <p className="detail-actions"><a className="pill" id="detail-link" href="#" target="_blank" rel="noopener noreferrer"><span id="detail-link-label">Open project</span> <span aria-hidden="true">↗</span></a><a className="detail-github" id="detail-github" href="#" target="_blank" rel="noopener noreferrer">GitHub</a><button className="chip" id="detail-back" type="button">Back to the cluster</button></p>
      </div>
    </div>
  </section>
}
