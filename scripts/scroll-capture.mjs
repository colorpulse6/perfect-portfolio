#!/usr/bin/env node
// Checks for the /scroll/ route over the Chrome DevTools Protocol, against a
// production build (`npx gatsby serve -p 9123 -H 127.0.0.1`). Shell rows read the
// server-rendered page; engine rows drive the running engine through its debug
// hook (?ss-debug exposes window.__ss), ported from the prototype's capture.mjs
// (docs/features/scroll-scenes-experiment/prototype/capture.mjs, r14) and adapted
// as PLAN.md section 5.3 says: hybrid only, scoped to the .ss root, data read
// from the repo (content/newsletter, gatsby-node.js, src/helpers/aboutFaq.ts).
//
//   node scripts/scroll-capture.mjs --check                 every row (about 8 minutes)
//   node scripts/scroll-capture.mjs --check --only=dives,a11y   some groups (names below)
//   --url=<page>   another server (default http://127.0.0.1:9123/?ss-debug)
//
// Groups: shell, engine, ghosts, copy, marks, stories, essays, creative, orbit, gestures, links,
// panel, projects, dives, context, a11y, fit, teardown. Needs Node 22 (fetch, WebSocket),
// Google Chrome ($CHROME overrides the path) and ImageMagick's magick for the
// pixel safeguard (the row fails without it).
import { spawn, execFileSync } from 'node:child_process'
import { accessSync, constants, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import sharp from 'sharp'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESSAYS, COLORPULSE_ALBUMS, RELEASES } from '../src/components/scroll/data/content.ts'
import { formatTextContent } from '../src/helpers/wordReveal.ts'
const argv = process.argv.slice(2)
const page = (argv.find(a => a.startsWith('--url=')) || '--url=http://127.0.0.1:9123/?ss-debug').slice(6)
const origin = new URL(page).origin
const only = (argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean)
const want = group => !only.length || only.includes(group)
const chromeBin = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const pendingEngine = ['budget (M5)', 'frames mode']

// ------------------------------------------------------------------ what the page must show
// The legend in scroll order, and each scene's stagger group: its class, step and
// item count (prototype index.html, r14). Data-driven groups also match __ss.setSizes.
const LEGEND = ['Intro', 'About', 'Projects', 'Tools and games', 'Essays', 'Creative', 'Newsletter', 'Changelog', 'Work with me', 'Contact', 'Atlas']
const STAGGER = [['about', 'facts', '0.04', 3], ['tools', 'ring', '0.03', 5], ['essays', 'essay-spread', '0.05', 2], ['newsletter', 'pieces index', '0.012', null], ['changelog', 'pieces', '0.03', null], ['contact', 'links', '0.03', 4]]
const SCENE_IDS = ['hero', 'about', 'projects', 'tools', 'essays', 'creative', 'newsletter', 'changelog', 'work', 'contact', 'atlas']
const NEWS = LEGEND.indexOf('Newsletter')
const SIZES = [[1440, 900], [1366, 768], [1280, 720], [1024, 768], [768, 1024], [390, 844]]
// Nic's links, as the site's header has them, and their names in the row (the last shows its word)
const SOCIAL_LINKS = ['https://github.com/colorpulse6', 'https://www.linkedin.com/in/nic-barnes-a3297217/', 'https://medium.com/@colorpulse_6839', 'https://www.npmjs.com/~colorpulse', 'https://buymeacoffee.com/nicbarnes']
const SOCIAL_LABELS = ['GitHub', 'LinkedIn', 'Medium', 'npm', 'Support']
const SOCIAL_WORDS = ['', '', '', '', 'Support']
// Words Nic asked to keep out of the copy (round 11); the quoted letters and the
// marks' own names are exempt. Words and markup that went in rounds 12 and 13.
const BANNED = /\bReact\b|\bTypeScript\b|\bNode(\.js)?\b/
const GONE = /\bCoffee\b|Buy me a coffee|All articles|Open the full issue/
const GONE_MARKUP = '.ss .hud-tech, .ss .tech-row, .ss .hud-bottom, .ss .issue-more'
// The letters, read from content/newsletter/<week>/index.md, newest first: front
// matter, and the body as blocks (a "## " heading, a picture with its alt text as
// the caption, or a paragraph with links and code as plain text). The empty
// editorial comment in issue 12 has no visible body (letterBlocks.ts drops it too).
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const newsDir = path.join(repo, 'content', 'newsletter')
const squash = s => s.replace(/\s+/g, ' ').trim()
const ISSUES = readdirSync(newsDir).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort().reverse().map(week => {
  const raw = readFileSync(path.join(newsDir, week, 'index.md'), 'utf8')
  const i1 = raw.indexOf('---'), i2 = raw.indexOf('\n---', i1 + 3)
  const fm = Object.fromEntries(raw.slice(i1 + 3, i2).trim().split('\n').map(l => { const j = l.indexOf(':'); return [l.slice(0, j).trim(), l.slice(j + 1).trim().replace(/^"|"$/g, '')] }))
  const d = new Date(fm.date + 'T00:00:00Z'), date = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
  const blocks = raw.slice(i2 + 4).replace(/<!--\s*-->/g, '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => {
    const img = p.match(/^!\[(.*?)\]\(\.\/img\/([^)]+)\)$/)
    if (p.startsWith('## ')) return { kind: 'h', text: squash(p.slice(3)) }
    if (img) return { kind: 'img', text: squash(img[1]), file: `${week}/img/${img[2]}` }
    return { kind: 'p', text: squash(p.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`([^`]+)`/g, '$1')) }
  })
  return { week, num: fm.issue, date, title: fm.title, deck: fm.deck, blocks, meta: `The weekly letter · No. ${fm.issue} · ${date}` }
})
// The bio: the two About FAQ answers (src/helpers/aboutFaq.ts), the second trimmed as DESIGN.md says.
const faq = [...readFileSync(path.join(repo, 'src', 'helpers', 'aboutFaq.ts'), 'utf8').matchAll(/a: "((?:[^"\\]|\\.)*)"/g)].map(m => m[1].replace(/\\"/g, '"'))
const BIO = [faq.find(a => a.startsWith('Nichalas Barnes is a software engineer')), (faq.find(a => a.startsWith('He builds Obsidian plugins')) || '').replace(', Brain Atlas and Cerebro Mycelium (Obsidian plugins), El Form (a typed React form library), and Throttle (a macOS usage tracker).', ', Brain Atlas (an Obsidian plugin), and El Form (a typed form library).')]
// The stories and the projects' technologies, from gatsby-node.js itself; Chimera's from content.ts (not a node yet).
const nodes = []
createRequire(import.meta.url)(path.join(repo, 'gatsby-node.js')).sourceNodes({ actions: { createNode: n => nodes.push(n), createTypes() {} }, createNodeId: s => s, createContentDigest: () => 'x' })
const WRITING = nodes.filter(n => n.internal.type === 'Writing')
const STORIES = WRITING.map(n => n.title)
const slug = title => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const PROJECT_TECH = Object.fromEntries(nodes.filter(n => n.internal.type === 'Project').map(n => [n.name, n.tech]))
const EXTRA_TECH = { Chimera: ['Unreal Engine 5', 'Astro'] }
const techOf = name => PROJECT_TECH[name] || EXTRA_TECH[name]
const PROJECT_NAMES = ['Chimera', 'Cerebro', 'Brain Atlas', 'GalAtlas', 'Polis Atlas', 'Job Toast', 'El Form']
const PROJECT_DESCRIPTIONS = Object.fromEntries(nodes.filter(n => n.internal.type === 'Project').map(n => [n.name, n.description]))
PROJECT_DESCRIPTIONS.Chimera = 'A JRPG in a painted hill town, with a hero who is drawn rather than modelled. Designed, art-directed and built in Unreal Engine 5; the site is the live status record of the build.'
PROJECT_DESCRIPTIONS['Job Toast'] = 'A shared home for the moving parts of a job search: saved roles, application stages, notes and contacts in one workspace, with a browser extension for saving jobs and AI-assisted cover letter drafts.'
// The marks' files: the sprite in the page is generated from these, one symbol per file.
const techDir = path.join(repo, 'src', 'components', 'scroll', 'tech')
const TECH_FILES = Object.fromEntries(readdirSync(techDir).filter(f => f.endsWith('.svg')).map(f => {
  const s = readFileSync(path.join(techDir, f), 'utf8')
  return [f.slice(0, -4), { ds: [...s.matchAll(/\sd="([^"]+)"/g)].map(m => m[1]), bytes: s.length, clean: !/<script|<image|<foreignObject|href=|url\(|<style|\son[a-z]+=/i.test(s) && /viewBox="0 0 24 24"/.test(s) }]
}))

// ------------------------------------------------------------------ page probes (run in the page)
// ghosts: at a hold only that station is on screen, between two holds only those two
const GHOSTS = `(() => {
  const p = __ss.sp, a = Math.floor(p + 1e-6), b = Math.ceil(p - 1e-6), allowed = new Set([a, b]);
  const pins = [...document.querySelectorAll('.ss .pin')], heads = [...document.querySelectorAll('.ss .scene')].map(x => x.querySelector('h1, h2').textContent.trim());
  const vis = (el) => { if (getComputedStyle(el).visibility === 'hidden') return 0; let o = 1; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none') return 0; o *= parseFloat(cs.opacity); } return o; };
  const on = (r) => r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
  const out = [];
  pins.forEach((pin, i) => {
    if (allowed.has(i)) return;
    for (const el of pin.querySelectorAll('h1, h2, .lead, .bio, .facts li, .ring li, .pieces li, .index li, .reader, .project-stage, .pill, .links li, .orbit-nav, .hint, .atlas-wrap')) {
      const o = vis(el), r = el.getBoundingClientRect();
      if (o > 0.02 && on(r)) out.push(i + ':' + el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + '@' + o.toFixed(2));
    }
  });
  const news = __ss.scenes.findIndex(x => x.id === 'newsletter');
  if (!allowed.has(news)) for (const tag of document.querySelectorAll('.ss .moon-tag')) { const o = vis(tag); if (o > 0.02 && on(tag.getBoundingClientRect())) out.push(news + ':moon-tag@' + o.toFixed(2)); }
  if (__ss.dust !== null && __ss.dust !== heads[a] && __ss.dust !== heads[b]) out.push('dust:"' + __ss.dust + '"');
  for (const B of __ss.bodies) if (B.scene < a && B.alpha > 0.02) out.push('body:' + B.set + '@' + B.alpha);
  return { p: Number(p.toFixed(2)), out };
})()`
// every station shows its own headline: the dust was rasterised from that heading and sits in its box
const STATION = i => `(() => {
  const own = document.querySelectorAll('.ss .scene')[${i}].querySelector('h1, h2'), want = own.textContent.trim();
  const vis = (el) => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) return false; } return true; };
  const shown = [...document.querySelectorAll('.ss .pin h1, .ss .pin h2')].filter(vis).map(el => el.textContent.trim());
  const dust = __ss.dust, box = __ss.dustBox && __ss.dustBox(), r = own.getBoundingClientRect(), pad = 16;
  const boxOk = dust === null ? null : !!(box && box.n > 0 && box.left >= r.left - pad && box.right <= r.right + pad && box.top >= r.top - pad && box.bottom <= r.bottom + pad);
  const ok = dust === null ? (shown.length === 1 && shown[0] === want) : (dust === want && boxOk && shown.length === 0);
  return { want, dust, boxOk, shown: shown.join(' | '), ok };
})()`
const NORM = "(s => s.replace(/[^a-z0-9 ]/gi, '').replace(/\\s+/g, ' ').trim().toLowerCase())"
const SEEN = `(() => {
  const norm = ${NORM}, vis = (el) => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return false; } return true; };
  const out = [...document.querySelectorAll('.ss .pin h1, .ss .pin h2, .ss .pin .pill')].filter(vis).map((el) => norm(el.textContent));
  if (__ss.dust) out.push(norm(__ss.dust));
  const heads = [...document.querySelectorAll('.ss .scene')].map(x => x.querySelector('h1, h2').textContent.trim());
  const a = Math.floor(__ss.sp), b = Math.min(a + 1, heads.length - 1);
  return { out, owned: __ss.dust === null || __ss.dust === heads[a] || __ss.dust === heads[b], dust: __ss.dust };
})()`
// time frozen, CSS animation paused: two captures of one hold are the same picture
const PX_FREEZE = "(() => { const st = document.createElement('style'); st.textContent = '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }'; document.head.appendChild(st); __ss.freeze(true); })()"
// the copy: banned words in visible and aria text (letters and marks exempt), gone words anywhere
const WORDS = `(() => {
  const hits = [], gone = [], root = document.querySelector('.ss');
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === 3) { if (n.parentElement.closest('script, style, noscript, .story-text')) continue; if (/${GONE.source}/.test(n.textContent)) gone.push(n.textContent.trim().slice(0, 60)); if (n.parentElement.closest('.reader .issue-body, .story-text, .project-tech, svg.ti')) continue; if (/${BANNED.source}/.test(n.textContent)) hits.push(n.textContent.trim().slice(0, 60)); }
    else { for (const a of ['aria-label', 'alt', 'title']) { const v = n.getAttribute(a); if (!v) continue; if (/${GONE.source}/.test(v)) gone.push(a + '=' + v.slice(0, 60)); if (!n.closest('svg.ti') && /${BANNED.source}/.test(v)) hits.push(a + '=' + v.slice(0, 60)); } }
  }
  return { hits, gone, essays: document.querySelector('.ss #essays h2').textContent.trim(), strip: document.querySelectorAll('${GONE_MARKUP}').length };
})()`
const SPRITE = `[...document.querySelectorAll('.ss .sprite symbol')].map(s => ({ id: s.id, ds: [...s.querySelectorAll('[d]')].map(e => e.getAttribute('d')), kids: s.children.length }))`
const CARDS = set => `[...document.querySelectorAll('.ss #${set} .ring li a')].map(a => ({ name: a.querySelector('strong').textContent.trim(), icons: [...a.querySelectorAll('.tech svg.ti')].map(s => { const u = s.querySelector('use'), r = s.getBoundingClientRect(); let b = 0; try { b = u.getBBox().width } catch (e) {} return { name: s.getAttribute('aria-label'), title: (s.querySelector('title') || {}).textContent, ref: u.getAttribute('href'), role: s.getAttribute('role'), w: Math.round(r.width), h: Math.round(r.height), box: Math.round(b), symbol: !!document.querySelector(u.getAttribute('href')) } }), dim: parseFloat(getComputedStyle(a.querySelector('.tech') || a).opacity), pxText: Math.min(...[...a.querySelectorAll('strong, .lab')].map(e => parseFloat(getComputedStyle(e).fontSize))) }))`
const DETAIL = `(() => { const row = document.getElementById('detail-tech'), card = document.querySelector('.ss .detail-card').getBoundingClientRect(), R = row.getBoundingClientRect(); return { hidden: row.hidden, inside: R.left >= card.left && R.right <= card.right && R.top >= card.top && R.bottom <= card.bottom, items: [...row.querySelectorAll('li')].map(li => { const s = li.querySelector('svg.ti'), u = s.querySelector('use'), r = s.getBoundingClientRect(); let b = 0; try { b = u.getBBox().width } catch (e) {} return { name: li.dataset.name, shown: (li.querySelector('span') || {}).textContent || '', w: Math.round(r.width), box: Math.round(b), px: parseFloat(getComputedStyle(li).fontSize), named: s.getAttribute('aria-hidden') === 'true' ? !!li.querySelector('span') : s.getAttribute('aria-label') === li.dataset.name && (s.querySelector('title') || {}).textContent === li.dataset.name } }) } })()`
const ORBIT = "(o => ({ planetA: Number(o.planetA.toFixed(2)), theta: o.theta, moons: o.vis.filter(v => v > 0.5).length, tags: o.tags, tagsIn: o.tagsIn, front: o.front, n: o.n }))(__ss.orbit)"
const REACH = "(o => ({ front: o.front, num: o.num, n: o.n, vis: Number(o.frontVis.toFixed(2)), tag: o.frontTag, row: o.row, pos: o.pos }))(__ss.orbit)"
// the reader: the article shown, its words block by block, how it is labelled and scrolls
const READ = `(() => {
  const open = [...document.querySelectorAll('.ss #newsletter .reader .issue:not([hidden])')], a = open[0], body = a.querySelector('.issue-body');
  const t = (s) => ((a.querySelector(s) || {}).textContent || '').trim();
  const sq = (s) => s.replace(/\\s+/g, ' ').trim();
  const blocks = [...body.children].map(el => el.tagName === 'H4' ? { kind: 'h', text: sq(el.textContent) } : el.tagName === 'FIGURE' ? { kind: 'img', text: sq(el.querySelector('figcaption').textContent), file: el.querySelector('img').dataset.src } : { kind: el.tagName === 'P' ? 'p' : el.tagName, text: sq(el.textContent) });
  return { k: Number(a.dataset.k), shown: open.length, alpha: getComputedStyle(a.parentElement).opacity, meta: t('.issue-meta'), title: t('h3'), deck: t('.issue-deck'), blocks, week: a.dataset.week, labelled: a.parentElement.getAttribute('aria-labelledby') === a.querySelector('h3').id && a.querySelector('h3').id === a.id + '-title', region: body.getAttribute('role') === 'region' && body.tabIndex === 0 && body.getAttribute('aria-labelledby') === a.querySelector('h3').id, scrollable: body.scrollHeight > body.clientHeight + 1, top: body.scrollTop, emdash: a.textContent.includes('\\u2014'), links: [...body.querySelectorAll('a')].every(x => x.target === '_blank' && /noopener/.test(x.rel)) };
})()`
const FRONT_BODY = "document.querySelector('.ss #newsletter .reader .issue:not([hidden]) .issue-body')"
const STATE = "({ y: scrollY, sp: Number(__ss.sp.toFixed(2)), front: __ss.orbit.front, consumed: __ss.orbit.consumed, ignored: __ss.orbit.ignored, settled: __ss.orbit.settled })"
const RSTATE = "(o => ({ y: scrollY, front: o.front, scroll: Math.round(o.scroll), wheeled: o.wheeled, held: o.held, passed: o.passed, focused: document.activeElement.classList.contains('issue-body') }))(__ss.orbit)"
const ANNOUNCE = "(o => ({ announced: o.announced, text: o.announcement, active: o.active, front: o.front, alpha: Number(o.readerAlpha.toFixed(2)) }))(__ss.orbit)"
const TSTATE = "(o => ({ y: scrollY, front: o.front, consumed: o.consumed, scroll: Math.round(o.scroll) }))(__ss.orbit)"
// Nic's links: shown, inside the viewport, new tab with noopener, under nothing; marks named and drawn
const SOCIAL = `(() => {
  const nav = document.querySelector('.ss .hud-social'), links = [...nav.querySelectorAll('a')];
  const vis = (el) => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) return false; } return true; };
  const R = nav.getBoundingClientRect();
  const inside = links.every(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; });
  const hit = (r) => r.width > 0 && r.left < R.right && R.left < r.right && r.top < R.bottom && R.top < r.bottom;
  const over = [...document.querySelectorAll('.ss .pin h1, .ss .pin h2, .ss .pin .lead, .ss .pin .bio, .ss .pin .pill, .ss .pin li, .ss .moon-tag, .ss .hud-nav, .ss .orbit-nav, .ss .reader, .ss .detail-card')].filter(vis).filter(el => hit(el.getBoundingClientRect())).map(el => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
  const box = __ss.dustBox && __ss.dustBox();
  if (box && box.n > 0 && hit({ width: 1, left: box.left, right: box.right, top: box.top, bottom: box.bottom })) over.push('dust');
  const hrefs = links.map(a => a.getAttribute('href')), newTab = links.every(a => a.target === '_blank' && /noopener/.test(a.rel));
  const labels = links.map(a => a.getAttribute('aria-label')), titles = links.map(a => a.getAttribute('title')), words = links.map(a => a.textContent.trim());
  const marks = links.every(a => { const s = a.querySelector('svg.ti'), u = s && s.querySelector('use'); if (!u || !document.querySelector(u.getAttribute('href')) || s.getAttribute('aria-hidden') !== 'true') return false; const r = s.getBoundingClientRect(); let b = 0; try { b = u.getBBox().width } catch (e) {} return r.width === 16 && r.height === 16 && b >= 7; });
  const rs = links.map(a => a.getBoundingClientRect());
  const targets = rs.every(r => r.width >= 24 && r.height >= 24) && rs.every((r, i) => i === 0 || r.left >= rs[i - 1].right + 2);
  const oneLine = new Set(rs.map(r => Math.round(r.top))).size === 1;
  const supportPx = parseFloat(getComputedStyle(nav.querySelector('.support span')).fontSize);
  return { visible: vis(nav), inside, over: over.join(' '), hrefs, newTab, labels, titles, words, marks, targets, oneLine, supportPx, width: Math.round(R.width), ok: vis(nav) && inside && over.length === 0 && newTab && marks && targets && oneLine && supportPx >= 11 };
})()`
// the reader panel at the hold: inside the viewport, under nothing, four lines or more at 15 to 17px
const PANEL = `(() => {
  const r = document.querySelector('.ss #newsletter .reader'), R = r.getBoundingClientRect();
  const vis = (el) => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) return false; } return true; };
  const hit = (b) => b.width > 0 && b.left < R.right && R.left < b.right && b.top < R.bottom && R.top < b.bottom;
  const over = [...document.querySelectorAll('.ss .hud-social, .ss .hud-nav, .ss .hud-top, .ss .orbit-nav, .ss .moon-tag, .ss .pin h2')].filter(vis).filter(el => hit(el.getBoundingClientRect())).map(el => el.classList[1] || el.classList[0] || el.tagName.toLowerCase());
  const box = __ss.dustBox && __ss.dustBox();
  if (box && box.n > 0 && hit({ width: 1, left: box.left, right: box.right, top: box.top, bottom: box.bottom })) over.push('dust');
  const a = document.querySelector('.ss #newsletter .reader .issue:not([hidden])'), op = a.querySelector('.issue-body'), ob = op.getBoundingClientRect(), cs = getComputedStyle(op);
  const inside = R.left >= 0 && R.right <= innerWidth && R.top >= 0 && R.bottom <= innerHeight && ob.top >= R.top && ob.bottom <= R.bottom + 1 && ob.width > 0;
  const lines = Math.floor(ob.height / parseFloat(cs.lineHeight)), size = parseFloat(cs.fontSize);
  return { ok: over.length === 0 && inside && parseFloat(getComputedStyle(r).opacity) > 0.95 && lines >= 4 && size >= 15 && size <= 17, over: over.join(' '), inside, size: Math.round(R.width) + 'x' + Math.round(R.height), lines, px: size, scrollable: op.scrollHeight > op.clientHeight + 1, renderer: __ss.renderer };
})()`
// every card fits: inside the viewport above the legend, no two overlapping
const FIT = sel => `(() => {
  const els = [...document.querySelectorAll('.ss ${sel} li')].filter(l => getComputedStyle(l).display !== 'none');
  const rs = els.map(l => l.getBoundingClientRect());
  const hb = document.querySelector('.ss .hud-nav').getBoundingClientRect();
  const inside = rs.every(r => r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= hb.top);
  let overlaps = 0;
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const a = rs[i], b = rs[j]; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlaps++; }
  return { shown: els.length, inside, overlaps, span: Math.round(Math.min(...rs.map(r => r.top))) + '..' + Math.round(Math.max(...rs.map(r => r.bottom))) + ' of ' + Math.round(hb.top), overflowX: document.documentElement.scrollWidth > innerWidth };
})()`
// where the keyboard focus is: inert, unseen, and which station's pin holds it
const FOCUS = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { none: true };
  const seen = (x) => { for (let e = x; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return false; } return true; };
  const pins = [...document.querySelectorAll('.ss .pin')], pin = pins.findIndex(p => p.contains(el));
  return { none: false, what: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''), inert: !!el.closest('[inert]'), seen: seen(el), pin, hud: !!el.closest('.ss .hud'), detail: !!el.closest('#detail') };
})()`

// ------------------------------------------------------------------ the run
const rows = []
const row = (name, pass, detail = '') => { rows.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`) }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const until = async (check, ms = 10000, step = 100) => { for (let t = 0; t < ms; t += step) { if (await check()) return true; await sleep(step) } return false }
// a group that throws fails as one row, and the run goes on
const group = async (name, fn) => { if (!want(name)) return; try { await fn() } catch (error) { row(`${name} (group)`, false, error.message.split('\n')[0]) } }
let chrome, session, profile
try {
  try { accessSync(chromeBin, constants.X_OK); row('chrome-absent', true, 'Chrome available') }
  catch { row('chrome-absent', true, `Chrome absent at ${chromeBin}; browser rows not run`); process.exitCode = 2 }
  if (!process.exitCode) {
    profile = mkdtempSync(path.join(os.tmpdir(), 'scroll-capture-'))
    const port = 9400 + Math.floor(Math.random() * 400)
    chrome = spawn(chromeBin, [
      '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
      '--window-size=1440,900', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
      '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu', 'about:blank',
    ], { stdio: 'ignore' })
    let ready = false
    for (let i = 0; i < 100; i++) {
      try { ready = (await fetch(`http://127.0.0.1:${port}/json/version`)).ok; if (ready) break } catch { /* startup */ }
      await sleep(100)
    }
    if (!ready) throw new Error('Chrome did not start')
    // Console errors and warnings for the whole run, for the last row. Other pages'
    // messages are the site's, not this route's, and are noted apart (both are on
    // production too, 2026-10-22): React hydration errors (#418, #423, #425) on a
    // fresh load of home, and react-three-fiber's THREE.Clock deprecation each time
    // home's particle canvas mounts. This route uses neither. A row that causes an
    // expected message (a forced context loss) names it in `expected` for its run.
    const SITE_NOISE = [/THREE\.Clock: This module has been deprecated/]
    const consoleLog = [], siteLog = []
    let consoleScope = 'scroll'
    let expected = [], expectedSeen = []
    async function tab() {
      const info = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
      const ws = new WebSocket(info.webSocketDebuggerUrl)
      await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
      let nextId = 0
      const waiting = new Map()
      const handlers = new Map()
      const errors = []
      const disposals = []
      const note = text => {
        if (expected.some(pattern => pattern.test(text))) { expectedSeen.push(text.split('\n')[0]); return }
        errors.push(text)
        if (consoleScope === 'scroll' && !SITE_NOISE.some(noise => noise.test(text))) consoleLog.push(text)
        else siteLog.push(`${consoleScope}: ${text}`)
      }
      ws.onmessage = event => {
        const message = JSON.parse(event.data)
        if (message.method && handlers.has(message.method)) handlers.get(message.method)(message.params)
        if (message.id && waiting.has(message.id)) {
          const { resolve, reject } = waiting.get(message.id); waiting.delete(message.id)
          message.error ? reject(new Error(message.error.message)) : resolve(message.result)
        } else if (message.method === 'Runtime.exceptionThrown') note(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text)
        else if (message.method === 'Runtime.consoleAPICalled') {
          const { type, args } = message.params
          if (type === 'error' || type === 'warning' || type === 'assert') note(`${type}: ${args.map(a => a.value ?? a.description).join(' ')}`)
          // the engine's dispose report (debug only): console.info('scroll scenes dispose', { loseContext })
          else if (type === 'info' && args[0]?.value === 'scroll scenes dispose') disposals.push(args[1]?.preview?.properties?.find(p => p.name === 'loseContext')?.value === 'true')
        } else if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level) && message.params.entry.source !== 'network') note(`log: ${message.params.entry.text}`)
      }
      const send = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++nextId; waiting.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }))
        setTimeout(() => { if (waiting.has(id)) { waiting.delete(id); reject(new Error(`timeout: ${method}`)) } }, 30000)
      })
      await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable')
      const evaluate = async expression => {
        const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
        if (result.exceptionDetails) throw new Error(`evaluate: ${result.exceptionDetails.exception?.description || result.exceptionDetails.text}`)
        return result.result.value
      }
      const viewport = (width, height) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 })
      const open = async (url, noJs = false) => {
        await send('Emulation.setScriptExecutionDisabled', { value: noJs })
        await send('Page.navigate', { url })
        if (await until(() => evaluate('document.readyState === "complete"'))) return
        throw new Error(`page did not load: ${url}`)
      }
      // the engine is running: more than 30 frames drawn, within 10 s
      const running = () => until(() => evaluate('(window.__ss ? __ss.frames : -1) > 30'))
      const openEngine = async (url, width = 1440, height = 900) => {
        await viewport(width, height)
        await open(url)
        if (!await running()) throw new Error(`engine did not reach 30 frames in 10 s: ${url}`)
      }
      // n frames after a snap, so poses, chips and the panel have followed
      const frames = async (n = 3) => { const f0 = await evaluate('__ss.frames'); await until(async () => await evaluate('__ss.frames') - f0 >= n, 1500, 25) }
      const goto = async (p, n = 3) => { await evaluate(`__ss.goto(${p})`); await frames(n) }
      // real input through Chrome's pipeline
      const mouse = async (x, y) => { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 }) }
      const click = async selector => {
        const box = await evaluate(`(r => r && { x: r.left + r.width / 2, y: r.top + r.height / 2 })(document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect())`)
        if (!box) throw new Error(`nothing to click: ${selector}`)
        await mouse(box.x, box.y)
      }
      const key = async (k, code, wait = 900, modifiers = 0) => {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: code, modifiers })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: code, modifiers })
        await sleep(wait)
      }
      const shot = async file => writeFileSync(file, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
      // listeners on a global (window or document), counted by CDP, not by the page
      const listeners = async expression => {
        const { result } = await send('Runtime.evaluate', { expression })
        const { listeners: found } = await send('DOMDebugger.getEventListeners', { objectId: result.objectId })
        await send('Runtime.releaseObject', { objectId: result.objectId })
        return found.length
      }
      const heap = async () => { await send('HeapProfiler.collectGarbage'); await send('HeapProfiler.collectGarbage'); return (await send('Runtime.getHeapUsage')).usedSize }
      const close = async () => { ws.close(); await fetch(`http://127.0.0.1:${port}/json/close/${info.id}`) }
      return { evaluate, send, viewport, open, openEngine, running, frames, goto, mouse, click, key, shot, listeners, heap, close, errors, disposals, on: (method, fn) => handlers.set(method, fn), off: method => handlers.delete(method) }
    }

    // ---------------------------------------------------------------- shell rows
    await group('shell', async () => {
      session = await tab()
      await session.viewport(1440, 900)
      await session.open(page)
      const head = await session.evaluate(`({title:document.title,canonical:document.querySelector('link[rel="canonical"]')?.href,robots:document.querySelector('meta[name="robots"]')?.content})`)
      row('SEO head', head.title === 'Software engineer and composer | Nichalas Barnes' && head.canonical === 'https://nichalasbarnes.com/' && !/noindex/.test(head.robots ?? ''), JSON.stringify(head))
      const shell = await session.evaluate(`({scenes:document.querySelectorAll('.ss .scene').length,links:document.querySelectorAll('.ss .hud-nav a').length,projects:document.querySelectorAll('.ss #projects .project-moon').length,tools:document.querySelectorAll('.ss #tools .ring li').length,letters:document.querySelectorAll('.ss .issue').length})`)
      row('SSR shell', shell.scenes === 11 && shell.links === 11 && shell.projects === 7 && shell.tools === 5 && shell.letters > 0, JSON.stringify(shell))
      await session.close(); session = await tab()
      await session.open(page, true)
      const fallback = await session.evaluate(`({scenes:document.querySelectorAll('.ss .scene').length,visible:getComputedStyle(document.querySelector('.ss .pin')).visibility,position:getComputedStyle(document.querySelector('.ss .pin')).position,story:!!document.querySelector('#creative .story-text'),newsletter:!!document.querySelector('.issue-body p'),projects:[...document.querySelectorAll('#projects .project-leaf')].filter(a => getComputedStyle(a).display !== 'none').length})`)
      row('no-JS fallback', fallback.scenes === 11 && fallback.visible === 'visible' && fallback.position !== 'fixed' && fallback.story && fallback.newsletter && fallback.projects === 7, JSON.stringify(fallback))
      await session.close(); session = null
    })
    session = await tab()
    const s = session
    const join = query => page + (page.includes('?') ? '&' : '?') + query
    const at = i => `scrollTo(0, ${i} * 3 * innerHeight + innerHeight * 0.9)`

    // ---------------------------------------------------------------- engine rows
    await group('engine', async () => {
      await s.openEngine(page)
      const version = await s.evaluate(`({ root: document.querySelector('.ss').dataset.ssVersion, script: __ss.version })`)
      row('version', !!version.root && version.root === version.script, JSON.stringify(version))

      const boot = await s.evaluate(`({ renderer: __ss.renderer, tier: __ss.tier, rm: __ss.rm, on: document.documentElement.classList.contains('ss-on') })`)
      row('boot', boot.renderer === 'webgl2' && boot.tier === 'high' && boot.rm === false && boot.on, JSON.stringify(boot))

      const fps = await s.evaluate(`new Promise(done => { const f0 = __ss.frames; setTimeout(() => done(__ss.frames - f0), 1000) })`)
      row('fps', fps >= 55, `${fps} frames in 1 s at 1440x900 (60 wanted)`)

      for (const fallback of [false, true]) {
        await s.openEngine(join(`p=${LEGEND.indexOf('About')}${fallback ? '&nogl=1' : ''}`))
        const sample = await s.evaluate(`(() => { const p = document.querySelector('#about .bio p'), r = p.getBoundingClientRect(), color = getComputedStyle(p.parentElement).color; const st = document.createElement('style'); st.id = 'contrast-probe'; st.textContent = '#about .bio p { color: transparent !important; text-shadow: none !important }'; document.head.appendChild(st); return { x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height), color, renderer:__ss.renderer } })()`)
        await s.frames(2)
        const png = Buffer.from((await s.send('Page.captureScreenshot', { format:'png' })).data, 'base64')
        const { data: pixels, info } = await sharp(png).raw().toBuffer({ resolveWithObject:true })
        await s.evaluate(`document.getElementById('contrast-probe').remove()`)
        const rgb = sample.color.match(/[\d.]+/g).map(Number), a = rgb[3] ?? 1
        const linear = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }
        const lum = c => c.reduce((sum, x, i) => sum + [0.2126, 0.7152, 0.0722][i] * linear(x), 0)
        let worst = Infinity, lightest = 0
        for (let iy = 1; iy <= 5; iy++) for (let ix = 1; ix <= 9; ix++) {
          const x = Math.max(0, Math.min(info.width - 1, Math.round(sample.x + sample.w * ix / 10)))
          const y = Math.max(0, Math.min(info.height - 1, Math.round(sample.y + sample.h * iy / 6)))
          const off = (y * info.width + x) * info.channels, bg = [...pixels.subarray(off, off + 3)]
          const fg = rgb.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a))
          lightest = Math.max(lightest, lum(bg))
          worst = Math.min(worst, (lum(fg) + .05) / (lum(bg) + .05))
        }
        row(`About paragraph contrast (${fallback ? 'Canvas2D' : 'WebGL'})`, worst >= 4.5 && sample.renderer === (fallback ? 'canvas2d' : 'webgl2'), `${worst.toFixed(2)}:1 minimum, lightest sampled luminance ${lightest.toFixed(3)}, ${sample.renderer}`)
      }
      await s.openEngine(page)

      // the smoothed position at 0, 25, 50, 75 and 100% of the document: 11 scenes, sp 0 to 10
      const spAt = []
      const maxY = await s.evaluate('document.documentElement.scrollHeight - innerHeight')
      for (const f of [0, 0.25, 0.5, 0.75, 1]) { await s.evaluate(`scrollTo(0, ${f} * ${maxY})`); await sleep(400); let prev = -1, now = await s.evaluate('__ss.sp'); for (let t = 0; t < 6000 && Math.abs(now - prev) > 0.002; t += 150) { prev = now; await sleep(150); now = await s.evaluate('__ss.sp') } spAt.push(Number(now.toFixed(2))) }
      const spWant = [0, 2.5, 5, 7.5, 10]
      row('position', spAt.every((sp, i) => Math.abs(sp - spWant[i]) <= 0.06), `sp ${spAt.join(' ')} (prototype: 0 2.46 4.96 7.46 9.96)`)

      // the legend: one chip per scene, in scroll order, labelled as the section is; a click travels there
      const legend = await s.evaluate(`({ chips: [...document.querySelectorAll('.ss .hud-nav a')].map(a => a.textContent + ' ' + a.getAttribute('href')), scenes: __ss.scenes.map(x => x.label + ' #' + x.id), sections: [...document.querySelectorAll('.ss .scene')].map(x => x.getAttribute('aria-label') + ' #' + x.id) })`)
      const names = legend.chips.map(c => c.split(' #')[0])
      row('legend = scene list', legend.chips.join('|') === legend.scenes.join('|') && legend.scenes.join('|') === legend.sections.join('|') && names.join('|') === LEGEND.join('|'), names.join(', '))
      await s.evaluate('scrollTo(0, 0)'); await until(async () => await s.evaluate('__ss.sp') < 0.01, 3000)
      await s.click(`.ss .hud-nav a[href="#newsletter"]`)
      const arrived = await until(async () => Math.abs(await s.evaluate('__ss.sp') - NEWS) < 0.02, 6000)
      const after = await s.evaluate(`({ sp: Number(__ss.sp.toFixed(2)), hash: location.hash })`)
      row('legend click navigates', arrived && after.hash === '', `Newsletter chip: sp ${after.sp} (want ${NEWS}), hash "${after.hash}"`)

      // the DOM contract: each scene's stagger group, its step and its item count
      const groups = await s.evaluate(`({ found: [...document.querySelectorAll('.ss .stagger')].map(g => [g.closest('.scene').id, [...g.classList].filter(c => c !== 'stagger').join(' '), g.dataset.step, g.children.length]), sizes: __ss.setSizes })`)
      const groupsWant = STAGGER.map(([id, cls, step, n]) => [id, cls, step, n ?? groups.sizes[id]])
      const groupsOk = JSON.stringify(groups.found) === JSON.stringify(groupsWant) && [['tools', 'tools'], ['newsletter', 'newsletter'], ['changelog', 'changelog']].every(([id, set]) => groups.found.find(g => g[0] === id)?.[3] === groups.sizes[set])
      row('stagger groups', groupsOk, groups.found.map(g => `${g[0]} ${g[2]} x${g[3]}`).join(', '))

      await s.openEngine(page)
      const ghosts = []; let ghostSamples = 0
      for (let i = 0; i < LEGEND.length; i++) for (const d of [0, -0.4, -0.2, 0.2, 0.4]) {
        const p = i + d; if (p < 0 || p > LEGEND.length - 1) continue
        await s.goto(p); ghostSamples++
        const r = await s.evaluate(GHOSTS)
        if (r.out.length) ghosts.push(`p=${r.p}: ${r.out.join(' ')}`)
      }
      row('ghosts (snap sweep)', ghosts.length === 0, `${ghostSamples} samples; ${ghosts.join('; ').slice(0, 400) || 'none'}`)

      const wrong = []
      for (let i = 0; i < LEGEND.length; i++) {
        // a snap, three frames, then up to 1 s: a loaded machine can stall a frame past the prototype's fixed 160 ms
        await s.goto(i)
        let r = await s.evaluate(STATION(i))
        for (let t = 0; !r.ok && t < 1000; t += 100) { await sleep(100); r = await s.evaluate(STATION(i)) }
        if (!r.ok) wrong.push(`${i}: wants "${r.want}", dust "${r.dust}", box ${r.boxOk}, shown "${r.shown}"`)
      }
      row('stations show their own headline', wrong.length === 0, wrong.join('; ') || `${LEGEND.length} stations`)

      // no line of copy shows twice, and the dust draws only the window's headlines
      const lines = await s.evaluate(`[...document.querySelectorAll('.ss .pin h1, .ss .pin h2, .ss .pin .pill:not(.project-actions *):not(.record-leaf *)')].map(el => ${NORM}(el.textContent))`)
      const dupStatic = lines.filter((l, i) => lines.indexOf(l) !== i)
      const dupLive = [], stray = []
      for (let p = 0; p <= LEGEND.length - 1 + 0.001; p += 0.1) {
        await s.goto(p.toFixed(2))
        const seen = await s.evaluate(SEEN)
        const d = seen.out.filter((l, i) => seen.out.indexOf(l) !== i)
        if (d.length) dupLive.push(`${p.toFixed(1)}: ${d.join(' | ')}`)
        if (!seen.owned) stray.push(`${p.toFixed(1)}: "${seen.dust}"`)
      }
      row('no line shown twice', !dupStatic.length && !dupLive.length && !stray.length, [...dupStatic, ...dupLive, ...stray].join('; ').slice(0, 400) || `${lines.length} lines, sweep p=0..${LEGEND.length - 1}`)

      // Canvas2D fallback
      await s.openEngine(join('nogl=1'))
      const nogl = await s.evaluate(`({ renderer: __ss.renderer, frames: __ss.frames })`)
      row('Canvas2D fallback (?nogl=1)', nogl.renderer === 'canvas2d', JSON.stringify(nogl))

      // calm motion: the media query, and the ?rm=1 debug hold
      const CALM = `({ rm: __ss.rm, calm: document.documentElement.classList.contains('calm'), h1: getComputedStyle(document.querySelector('.ss h1')).opacity, dust: __ss.dust })`
      const calmOk = c => c.rm === true && c.calm && c.h1 === '1' && c.dust === null
      await s.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
      await s.openEngine(page)
      const calmMedia = await s.evaluate(CALM)
      await s.send('Emulation.setEmulatedMedia', { features: [] })
      row('calm motion (prefers-reduced-motion)', calmOk(calmMedia), JSON.stringify(calmMedia))
      await s.openEngine(join('rm=1'))
      const calmQuery = await s.evaluate(CALM)
      row('calm motion (?rm=1)', calmOk(calmQuery), JSON.stringify(calmQuery))

      // 390px: the balanced tier, and nothing wider than the screen
      await s.openEngine(page, 390, 844)
      const phone = await s.evaluate(`({ tier: __ss.tier, renderer: __ss.renderer, scrollWidth: document.documentElement.scrollWidth, innerWidth })`)
      row('390px layout', phone.tier === 'balanced' && phone.scrollWidth <= phone.innerWidth, JSON.stringify(phone))
    })

    // ---------------------------------------------------------------- ghosts: live, and the pixel safeguard
    await group('ghosts', async () => {
      // a slow scroll with holds, sampled in flight and at rest, then jumps straight across stations
      await s.openEngine(page)
      const found = []; let samples = 0
      for (let i = 0; i < LEGEND.length; i++) {
        await s.evaluate(at(i))
        await sleep(350); const mid = await s.evaluate(GHOSTS); samples++
        if (mid.out.length) found.push(`flight to ${i} p=${mid.p}: ${mid.out.join(' ')}`)
        await sleep(1200); const hold = await s.evaluate(GHOSTS); samples++
        if (hold.out.length) found.push(`hold ${i} p=${hold.p}: ${hold.out.join(' ')}`)
      }
      for (const [from, to] of [[0, 7], [7, 2], [2, 10], [10, 5]]) {
        await s.evaluate(at(from)); await sleep(1600)
        await s.evaluate(at(to))
        let waited = 0
        for (const wait of [250, 500, 900, 1600]) { await sleep(wait - waited); waited = wait; const r = await s.evaluate(GHOSTS); samples++; if (r.out.length) found.push(`jump ${from} to ${to} at ${wait}ms p=${r.p}: ${r.out.join(' ')}`) }
      }
      row('ghosts (live scroll and jumps)', !found.length, `${samples} samples; ${found.join('; ').slice(0, 400) || 'none'}`)

      // Through the stations in order on one page, each hold's frame against the same
      // frame with every other station taken out (__ss.solo): they may differ by no
      // more than 200 px (6% fuzz) over the noise floor of a third capture. Both renderers.
      let magick = true
      try { execFileSync('magick', ['-version'], { stdio: 'ignore' }) } catch { magick = false }
      if (!magick) { row('ghosts (pixel safeguard)', false, 'ImageMagick magick not found; the row needs it'); return }
      const pxDir = mkdtempSync(path.join(os.tmpdir(), 'scroll-capture-px-'))
      const ae = (x, y) => { try { execFileSync('magick', ['compare', '-metric', 'AE', '-fuzz', '6%', x, y, 'null:'], { stdio: ['ignore', 'ignore', 'pipe'] }); return 0 } catch (e) { const n = Number(String(e.stderr || '').trim().split(' ')[0]); return Number.isFinite(n) && e.status === 1 ? n : NaN } }
      try {
        for (const extra of ['', 'nogl=1']) {
          await s.openEngine(join(['p=0', extra].filter(Boolean).join('&'))); await s.evaluate(PX_FREEZE); await s.frames(3)
          const bad = []; let worst = 0, floor = 0
          for (let i = 0; i < LEGEND.length; i++) {
            for (const p of [i - 0.6, i - 0.3, i]) if (p >= 0) await s.goto(p)
            const A = path.join(pxDir, `a${i}.png`), B = path.join(pxDir, `b${i}.png`), C = path.join(pxDir, `c${i}.png`)
            await s.shot(A); await s.evaluate(`__ss.solo(${i})`); await s.frames(3); await s.shot(B); await s.evaluate('__ss.solo(-1)'); await s.frames(3); await s.shot(C)
            const ab = ae(A, B), ac = ae(A, C)
            worst = Math.max(worst, ab); floor = Math.max(floor, ac)
            if (!(ab - ac <= 200)) bad.push(`${i}: ${ab} px differ in solo (floor ${ac})`)
          }
          // the captures must hold the scene: two stations' frames differ widely, or a blank capture would pass
          const apart = ae(path.join(pxDir, 'a1.png'), path.join(pxDir, 'a2.png'))
          if (!(apart > 20000)) bad.push(`captures too alike to judge: stations 1 and 2 differ by ${apart} px`)
          row(`ghosts (pixel safeguard, ${extra ? 'Canvas2D' : 'WebGL'})`, !bad.length, `${LEGEND.length} stations, worst ${worst} px, floor ${floor} px, stations 1 and 2 apart ${apart} px; ${bad.join('; ') || 'none over 200'}`)
        }
      } finally { rmSync(pxDir, { recursive: true, force: true }) }
    })

    // ---------------------------------------------------------------- copy
    await group('copy', async () => {
      await s.openEngine(page)
      const words = await s.evaluate(WORDS)
      const goneHits = [...words.gone], detailHits = []
      let cards = 0
      const detailSets = await s.evaluate('__ss.detailSets')
      for (const [set, n] of await s.evaluate('Object.entries(__ss.setSizes)')) for (let k = 0; k < n; k++) {
        if (!detailSets.includes(set)) continue
        const text = await s.evaluate(`__ss.detailText('${set}', ${k})`); cards++
        const m = text && text.match(BANNED), g = text && text.match(GONE)
        if (m) detailHits.push(`${set} ${k}: ...${text.slice(Math.max(0, m.index - 30), m.index + 40)}...`)
        if (g) goneHits.push(`${set} ${k}: ...${text.slice(Math.max(0, g.index - 30), g.index + 40)}...`)
      }
      const bio = await s.evaluate("[...document.querySelectorAll('.ss #about .bio p')].map(p => p.textContent.trim())")
      const bioOk = bio.length === 2 && bio[0] === BIO[0] && bio[1] === BIO[1] && !BANNED.test(bio.join(' ')) && !/[\u2013\u2014]/.test(bio.join(' '))
      row('copy: React, TypeScript and Node named nowhere', !words.hits.length && !detailHits.length && bioOk, `page ${words.hits.join(' | ') || 'none'}; ${cards} detail cards (${detailSets.join(' ')}): ${detailHits.join(' | ') || 'none'}; bio from aboutFaq.ts ${bioOk}`)
      await s.goto(LEGEND.indexOf('Essays')); await sleep(160)
      const essaysDust = await s.evaluate('__ss.dust')
      const goneOk = !goneHits.length && words.strip === 0 && words.essays === 'Ideas worth sitting with.' && essaysDust === 'Ideas worth sitting with.'
      row('copy: rounds 12 and 13 words and markup gone', goneOk, `still there ${goneHits.join(' | ') || 'none'}; strip or link elements ${words.strip}; Essays h2 "${words.essays}", dust "${essaysDust}"`)
    })

    // ---------------------------------------------------------------- technology marks
    await group('marks', async () => {
      await s.openEngine(page)
      const sprite = await s.evaluate(SPRITE)
      const spriteBad = []
      for (const [name, f] of Object.entries(TECH_FILES)) { const sym = sprite.find(x => x.id === `i-${name}`); if (!sym) spriteBad.push(`${name}: not in the sprite`); else if (sym.ds.join('|') !== f.ds.join('|') || !sym.kids) spriteBad.push(`${name}: the sprite's paths differ from the file`); if (!f.clean) spriteBad.push(`${name}: not a plain icon file`); if (f.bytes > 6000) spriteBad.push(`${name}: ${f.bytes} bytes`) }
      for (const sym of sprite) if (!TECH_FILES[sym.id.slice(2)]) spriteBad.push(`${sym.id}: no file`)
      const cardBad = [], detailBad = []
      let marks = 0
      for (const set of ['tools']) {
        const scene = LEGEND.indexOf('Tools and games')
        for (const [w, h] of [[1440, 900], [390, 844]]) {
          await s.openEngine(join(`p=${scene}`), w, h); await sleep(200)
          const cards = await s.evaluate(CARDS(set))
          for (const c of cards) {
            const want = techOf(c.name)
            if (!want) { cardBad.push(`${c.name}: not in gatsby-node.js (or the Chimera list)`); continue }
            const names = c.icons.map(i => i.name)
            if (names.join('|') !== want.join('|')) cardBad.push(`${c.name} ${w}: marks ${names.join(', ')} vs gatsby-node.js ${want.join(', ')}`)
            for (const i of c.icons) { marks++; if (!(i.symbol && i.role === 'img' && i.title === i.name && i.w >= 14 && i.w <= 16 && i.h === i.w && i.box >= 7)) cardBad.push(`${c.name} ${w} ${i.name}: ${JSON.stringify(i)}`) }
            if (!(c.dim > 0.5 && c.dim < 1) || c.pxText < 11) cardBad.push(`${c.name} ${w}: dim ${c.dim}, text ${c.pxText}px`)
          }
          if (cards.length !== 5) cardBad.push(`${set} ${w}: ${cards.length} cards`)
        }
        await s.viewport(1440, 900)
        const n = (await s.evaluate('__ss.setSizes'))[set]
        for (let k = 0; k < n; k++) {
          const items = await s.evaluate(`__ss.detailTech('${set}', ${k})`), name = await s.evaluate("document.getElementById('detail-title').textContent")
          const want = techOf(name) || []
          if (items.map(i => i.name).join('|') !== want.join('|')) detailBad.push(`${name}: detail marks ${items.map(i => i.name).join(', ')} vs gatsby-node.js ${want.join(', ')}`)
          for (const i of items) if (i.shown !== (BANNED.test(i.name) ? '' : i.name)) detailBad.push(`${name} ${i.name}: shows "${i.shown}"`)
        }
      }
      // Tools and the other dive scenes still use the detail card.
      for (const [w, h, q] of [[1440, 900, `p=${LEGEND.indexOf('Tools and games')}&dive=t1&dt=1`], [390, 844, `p=${LEGEND.indexOf('Tools and games')}&dive=t1&dt=1`]]) {
        await s.openEngine(join(q), w, h); await sleep(250)
        const d = await s.evaluate(DETAIL)
        if (d.hidden || !d.inside || !d.items.length || d.items.some(i => !(i.w === 16 && i.box >= 7 && i.px >= 11 && i.named))) detailBad.push(`${q} at ${w}: ${JSON.stringify(d)}`)
      }
      for (const [w, h] of [[1440, 900], [390, 844]]) {
        await s.openEngine(join(`p=${LEGEND.indexOf('Projects')}`), w, h)
        for (let k = 0; k < 7; k++) {
          await s.evaluate(`__ss.projectTo(${k})`); await sleep(100)
          const p = await s.evaluate(`(() => { const a = document.querySelector('.ss #projects .project-leaf:not([hidden]):not(.outgoing)'); return { name: a.querySelector('h3').textContent, names: [...a.querySelectorAll('.project-tech li')].map(li => li.textContent.trim()), marks: [...a.querySelectorAll('.project-tech svg.ti')].map(s => { const u = s.querySelector('use'); return !!document.querySelector(u.getAttribute('href')) && s.getAttribute('aria-hidden') === 'true' }) } })()`)
          if (p.names.join('|') !== techOf(p.name)?.join('|') || !p.marks.every(Boolean)) cardBad.push(`${p.name} panel marks at ${w}: ${p.names.join(', ')}`)
        }
      }
      row('technology marks', !spriteBad.length && !cardBad.length && !detailBad.length, `${Object.keys(TECH_FILES).length} files, ${sprite.length} symbols, ${marks} marks on Tools cards; Projects panel checked for all seven; sprite ${spriteBad.join('; ') || 'same as the files'}; cards ${cardBad.join('; ').slice(0, 300) || 'right'}; details ${detailBad.join('; ').slice(0, 300) || 'right'}`)
    })

    // ---------------------------------------------------------------- essays and Creative
    await group('essays', async () => {
      for (const [w, h] of [[1440, 813], [1280, 720], [1024, 768], [390, 844]]) {
        await s.openEngine(join('p=4'), w, h)
        const r = await s.evaluate(`(() => { const area = document.querySelector('#essays .essay-spread'), cards = [...area.querySelectorAll('.essay-card')], h = document.querySelector('.hud-nav').getBoundingClientRect(), top = document.querySelector('.hud-top').getBoundingClientRect(), box = area.getBoundingClientRect(); return { headline:document.querySelector('#essays h2').textContent, dust:__ss.dust, detail:__ss.detailSets.includes('essays'), area:[box.left,box.top,box.right,box.bottom], hud:h.top, header:top.bottom, overflow:document.documentElement.scrollWidth>innerWidth, cards:cards.map(c=>({ title:c.querySelector('h3').textContent, meta:c.querySelector('.lab').textContent, excerpt:c.querySelector('p').textContent, href:c.querySelector('a').href, label:c.querySelector('a').textContent.trim(), rel:c.querySelector('a').rel, image:c.querySelector('img').naturalWidth })) } })()`)
        const copy = r.cards.length === ESSAYS.length && r.cards.every((card, i) => card.title === ESSAYS[i].title && card.meta === ESSAYS[i].meta && card.excerpt === ESSAYS[i].excerpt && card.href === ESSAYS[i].link && card.label.includes('Read on Medium') && card.rel.includes('noopener') && card.image > 0)
        row(`essays: reading cards (${w}x${h})`, copy && !r.detail && r.headline === 'Ideas worth sitting with.' && r.dust === r.headline && r.area[0] >= 0 && r.area[2] <= w && r.area[1] >= r.header && r.area[3] <= r.hud && !r.overflow, `${r.cards.length} cards, copy ${copy}, detail ${r.detail}, box ${r.area.join(',')}, header ${r.header}, legend ${r.hud}`)
      }
      await s.openEngine(join('p=4'), 390, 844)
      const edge = await s.evaluate(`(() => { const a=document.querySelector('#essays .essay-spread'), r=a.getBoundingClientRect(); return { x:Math.round(r.left+r.width/2), y:Math.round(r.top+r.height/2), scrollable:a.scrollHeight>a.clientHeight+1, page:scrollY } })()`)
      await s.send('Input.dispatchMouseEvent', { type:'mouseWheel', x:edge.x, y:edge.y, deltaX:0, deltaY:120 }); await sleep(200)
      const first = await s.evaluate('scrollY')
      if (first === edge.page) { await sleep(450); await s.send('Input.dispatchMouseEvent', { type:'mouseWheel', x:edge.x, y:edge.y, deltaX:0, deltaY:120 }); await sleep(200) }
      const passed = await s.evaluate('scrollY')
      row('essays: scene wheel moves on', !edge.scrollable && passed > edge.page, `scrollable ${edge.scrollable}, page ${edge.page} to ${first} to ${passed}`)
    })
    await group('creative', async () => {
      const sizes = [[1440, 813], [1366, 768], [1280, 720], [1024, 768], [390, 844]]
      const inspect = `(() => {
        const box = el => el.getBoundingClientRect(), inside = (a,b) => a.left >= b.left-1 && a.top >= b.top-1 && a.right <= b.right+1 && a.bottom <= b.bottom+1,
          worlds = [document.getElementById('creative-stories'),document.getElementById('creative-music')].filter(x=>!x.hidden),
          header=box(document.querySelector('.hud-top')), legend=box(document.querySelector('.hud-nav')), headline=box(document.querySelector('#creative h2')),
          children=worlds.every(w=>[...w.querySelectorAll('.story-index,.story-panel,.story-header,.story-text,.story-progress,.music-tabs,.music-project:not([hidden]),.record-art,.record-copy,.creative-controls')].filter(x=>!x.closest('[hidden]')).every(x=>inside(box(x),box(w))));
        return { visible:worlds.length, fit:worlds.every(w=>{const r=box(w);return r.left>=0&&r.right<=innerWidth&&r.top>=header.bottom&&r.bottom<=legend.top&&r.top>headline.bottom}), children,
          separate:worlds.length<2||box(worlds[0]).right<box(worlds[1]).left, overflow:document.documentElement.scrollWidth>innerWidth,
          stories:document.querySelectorAll('.story-choice').length, records:document.querySelectorAll('.record-leaf').length, covers:[...document.querySelectorAll('.record-sleeve img')].map(x=>x.complete&&x.naturalWidth>0),
          ghosts:document.querySelectorAll('.story-bead,.story-planet,.record-type').length,
          tabs:[...document.querySelectorAll('.music-tabs [role=tab]')].map(x=>[x.textContent.trim(),x.getAttribute('aria-selected'),x.getAttribute('aria-controls'),document.getElementById(x.getAttribute('aria-controls'))?.getAttribute('role')]),
          minPx:Math.min(...[...document.querySelectorAll('#creative h3,.story-choice,.story-text,.creative-controls,.music-tabs button,.record-copy .lab,.record-copy p,.record-links a')].filter(x=>!x.closest('[hidden]')).map(x=>parseFloat(getComputedStyle(x).fontSize))) }
      })()`
      for (const [w,h] of sizes) {
        await s.openEngine(join('p=5'),w,h)
        await until(() => s.evaluate(`[...document.querySelectorAll('.record-sleeve img')].every(x=>x.complete&&x.naturalWidth>0)`),5000)
        const r=await s.evaluate(inspect)
        row(`creative: both rooms fit (${w}x${h})`,r.visible===(w<820?1:2)&&r.fit&&r.children&&r.separate&&!r.overflow&&r.stories===17&&r.records===9&&r.covers.length===9&&r.covers.every(Boolean)&&r.ghosts===0&&r.minPx>=11&&r.tabs.map(t=>t[0]).join('|')==="Alex's Hand|Colorpulse|Priaprizm"&&r.tabs.every(t=>t[3]==='tabpanel')&&r.tabs.map(t=>t[1]).join('|')==='true|false|false',JSON.stringify(r))
        if (w<820) { await s.evaluate(`document.getElementById('creative-tab-music').click()`); const m=await s.evaluate(inspect); row('creative: phone music fits',m.visible===1&&m.fit&&m.children&&!m.overflow,JSON.stringify(m)) }
      }
      await s.openEngine(join('p=5'),1440,813)
      const storyBad=[]
      for(let k=0;k<WRITING.length;k++) {
        await s.evaluate(`document.querySelectorAll('.story-choice')[${k}].click()`)
        const r=await s.evaluate(`(() => { const a=document.querySelector('.story-leaf:not([hidden])'); return {title:a.querySelector('h4').textContent,html:a.querySelector('.story-text').innerHTML,shown:document.querySelectorAll('.story-leaf:not([hidden])').length} })()`)
        const expected=await s.evaluate(`(() => {const d=document.createElement('div');d.innerHTML=${JSON.stringify(formatTextContent(WRITING[k].content))};return d.innerHTML})()`)
        if(r.title!==WRITING[k].title||r.html!==expected||r.shown!==1)storyBad.push(k)
      }
      row('creative: all seventeen full stories and links',!storyBad.length,storyBad.join(',')||'all match source content')
      const releaseBad=[]
      for(let k=0;k<RELEASES.length;k++) {
        await s.evaluate(`__ss.creativeWorld('music'); __ss.creativeTo(${k})`)
        const r=await s.evaluate(`(() => {const a=document.querySelector('.record-leaf:not([hidden])');return {title:a.querySelector('h4').textContent,meta:a.querySelector('.lab').textContent,description:a.querySelector('p').textContent,href:a.querySelector('.record-links a').href,spotify:a.querySelector('.music-pill').href,cover:a.querySelector('.record-sleeve img').naturalWidth,shown:document.querySelectorAll('.record-leaf:not([hidden])').length}})()`)
        const x=RELEASES[k]
        if(r.title!==x.title||r.meta!==`${x.date} · ${x.tracks} tracks`||r.description!==x.description||r.href!==x.link||r.spotify!=='https://open.spotify.com/artist/0iFemeRah3zjZQoctmYf2v'||r.cover<1||r.shown!==1)releaseBad.push(k)
      }
      row('creative: nine albums with covers and metadata',!releaseBad.length,releaseBad.join(',')||'all match release table')
      const projectBad=[]
      await s.evaluate(`document.getElementById('music-tab-colorpulse').click()`)
      for(let k=0;k<COLORPULSE_ALBUMS.length;k++) {
        if(k) await s.evaluate(`document.querySelector('#music-panel-colorpulse [data-creative-step="1"]').click()`)
        const r=await s.evaluate(`(() => {const a=document.querySelector('.tape-leaf:not([hidden])');return {title:a.querySelector('h4').textContent,href:a.querySelector('a').href,count:document.getElementById('tape-count').textContent}})()`)
        if(r.title!==COLORPULSE_ALBUMS[k].title||r.href!==COLORPULSE_ALBUMS[k].link||r.count!==`${k+1} of 3`)projectBad.push(k)
      }
      const profile=await s.evaluate(`document.querySelector('#music-panel-colorpulse > a').href`)
      await s.evaluate(`document.getElementById('music-tab-priaprizm').click()`)
      const pria=await s.evaluate(`(() => {const c=document.querySelector('.priaprizm-card');return {name:c.querySelector('h4').textContent,place:c.querySelector('p').textContent,href:c.querySelector('a').href,tracks:document.querySelectorAll('#music-panel-priaprizm .record-leaf,#music-panel-priaprizm .tape-leaf').length}})()`)
      row('creative: Colorpulse albums and Priaprizm identity',!projectBad.length&&profile==='https://soundcloud.com/colorpulse'&&pria.name==='Priaprizm'&&pria.place==='Seattle, Washington'&&pria.href==='https://priaprizm.bandcamp.com/'&&pria.tracks===0,`${projectBad.join(',')||'albums match'}, ${JSON.stringify(pria)}`)
      await s.evaluate(`document.getElementById('music-tab-priaprizm').focus()`);await s.key('ArrowLeft',37,0)
      const musicKey=await s.evaluate(`({selected:document.getElementById('music-tab-colorpulse').getAttribute('aria-selected'),focused:document.activeElement.id,panel:document.getElementById('music-panel-colorpulse').hidden})`)
      row('creative: music tabs use arrow keys and selected panels',musicKey.selected==='true'&&musicKey.focused==='music-tab-colorpulse'&&!musicKey.panel,JSON.stringify(musicKey))
      await s.openEngine(join('p=5'),1440,813)
      await s.evaluate(`document.querySelector('.story-choice').focus()`); await s.key('ArrowLeft',37,0)
      const storyWrap=await s.evaluate('__ss.creativeCarousel.story')
      await s.evaluate(`document.querySelector('.music-tabs button').click(); document.querySelector('#music-panel-alex [data-creative-step="-1"]').click()`)
      const recordWrap=await s.evaluate('__ss.creativeCarousel.record')
      const sp=await s.evaluate(`(() => {const r=document.querySelector('.story-panel').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`)
      await s.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:sp.x,y:sp.y,deltaX:120,deltaY:0})
      const storyWheel=await s.evaluate('__ss.creativeCarousel.story')
      const mp=await s.evaluate(`(() => {const r=document.querySelector('#music-panel-alex').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`)
      await s.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:mp.x,y:mp.y,deltaX:120,deltaY:0})
      const recordWheel=await s.evaluate('__ss.creativeCarousel.record')
      row('creative: controls, keyboard and sideways wheel wrap',storyWrap===16&&recordWrap===8&&storyWheel===0&&recordWheel===0,`${storyWrap}, ${recordWrap}, ${storyWheel}, ${recordWheel}`)
      const reach=[]
      await s.evaluate(`document.querySelector('.story-choice').focus()`)
      for(let k=1;k<=17;k++){await s.key('ArrowRight',39,0);if(await s.evaluate('__ss.creativeCarousel.story')!==k%17)reach.push(`story key ${k}`)}
      await s.evaluate(`document.querySelector('#music-panel-alex [data-creative-step="1"]').focus()`)
      for(let k=1;k<=9;k++){await s.key('ArrowRight',39,0);if(await s.evaluate('__ss.creativeCarousel.record')!==k%9)reach.push(`record key ${k}`)}
      for(let k=1;k<=17;k++){await s.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:sp.x,y:sp.y,deltaX:120,deltaY:0});if(await s.evaluate('__ss.creativeCarousel.story')!==k%17)reach.push(`story wheel ${k}`)}
      for(let k=1;k<=9;k++){await s.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:mp.x,y:mp.y,deltaX:120,deltaY:0});if(await s.evaluate('__ss.creativeCarousel.record')!==k%9)reach.push(`record wheel ${k}`)}
      row('creative: all turns by keyboard and sideways wheel',!reach.length,reach.join('; ')||'17 stories and 9 albums by each input')
      await s.openEngine(join('p=5'),390,844)
      const reader=await s.evaluate(`(() => {const x=document.querySelector('.story-text');const r=x.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),max:x.scrollHeight-x.clientHeight,top:x.scrollTop,page:scrollY}})()`)
      await s.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:reader.x,y:reader.y,deltaX:0,deltaY:120});await sleep(100)
      const inPlace=await s.evaluate(`({top:document.querySelector('.story-text').scrollTop,page:scrollY})`)
      await s.evaluate(`document.querySelector('.story-text').scrollTop=0`)
      await s.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:reader.x,y:reader.y,deltaX:0,deltaY:-120});await sleep(450)
      await s.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:reader.x,y:reader.y,deltaX:0,deltaY:-120});await sleep(180)
      const out=await s.evaluate('scrollY')
      row('creative: reader scrolls in place then hands off',reader.max>0&&inPlace.top>0&&inPlace.page===reader.page&&out<reader.page,`reader ${reader.max}, in ${JSON.stringify(inPlace)}, page ${reader.page} to ${out}`)
      await s.evaluate(`document.getElementById('creative-tab-stories').focus()`);await s.key('ArrowRight',39,0)
      const tab=await s.evaluate(`({selected:document.getElementById('creative-tab-music').getAttribute('aria-selected'),role:document.getElementById('creative-music').getAttribute('role'),stories:document.getElementById('creative-stories').hidden,music:document.getElementById('creative-music').hidden})`)
      const touch=await s.evaluate(`(() => {const r=document.querySelector('#music-panel-alex').getBoundingClientRect();return {x:Math.round(r.left+r.width*.8),y:Math.round(r.top+r.height/2)}})()`)
      await s.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]})
      await s.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.x-80,y:touch.y}]})
      await s.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
      const swiped=await s.evaluate('__ss.creativeCarousel.record')
      row('creative: phone tabs and swipe',tab.selected==='true'&&tab.role==='tabpanel'&&tab.stories&&!tab.music&&swiped===1,`${JSON.stringify(tab)}, record ${swiped}`)
      // the full screen reader: it opens from the story, fills the viewport, keeps the scene still, and gives focus back
      for (const [w,h] of [[1440,813],[1024,768],[390,844]]) {
        await s.openEngine(join('p=5'),w,h)
        await s.evaluate(`document.querySelectorAll('.story-choice')[3].click()`)
        const before = await s.evaluate(`({ y: scrollY })`)
        await s.evaluate(`document.querySelector('.story-leaf:not([hidden]) [data-story-expand]').focus(); document.querySelector('.story-leaf:not([hidden]) [data-story-expand]').click()`)
        await sleep(200)
        const o = await s.evaluate(`(() => { const d=document.getElementById('story-reader'), r=d.getBoundingClientRect(), page=document.getElementById('story-reader-page'), t=document.getElementById('story-reader-text'), c=page.querySelector('.story-reader-column').getBoundingClientRect(); return { shown:!d.hidden, full:r.left===0&&r.top===0&&r.width===innerWidth&&r.height===innerHeight, title:document.getElementById('story-reader-title').textContent, html:t.innerHTML, focus:document.activeElement===page, room:page.scrollHeight>page.clientHeight, col:c.width, colFits:c.left>=0&&c.right<=innerWidth, font:parseFloat(getComputedStyle(t).fontSize), count:document.getElementById('story-reader-count').textContent, over:document.documentElement.scrollWidth>innerWidth } })()`)
        const want = await s.evaluate(`document.querySelector('.story-leaf:not([hidden]) .story-text').innerHTML`)
        const wantTitle = await s.evaluate(`document.querySelector('.story-leaf:not([hidden]) h4').textContent`)
        await s.send('Input.dispatchMouseEvent', { type:'mouseWheel', x:Math.round(w/2), y:Math.round(h/2), deltaX:0, deltaY:300 }); await sleep(250)
        const scrolled = await s.evaluate(`({ top: document.getElementById('story-reader-page').scrollTop, y: scrollY, bar: document.querySelector('#story-reader .story-reader-progress').getAttribute('aria-valuenow') })`)
        await s.key('ArrowRight',39,0); await sleep(150)
        const nextStory = await s.evaluate(`({ title: document.getElementById('story-reader-title').textContent, story: __ss.creativeCarousel.story, count: document.getElementById('story-reader-count').textContent, top: document.getElementById('story-reader-page').scrollTop  , y: scrollY })`)
        await s.key('Escape',27,0); await sleep(150)
        const closed = await s.evaluate(`({ hidden: document.getElementById('story-reader').hidden, focusIsExpand: document.activeElement?.hasAttribute('data-story-expand')  , y: scrollY, world: __ss.creativeCarousel.world })`)
        const ok = o.shown && o.full && o.title === wantTitle && o.html === want && o.focus && o.room && o.colFits && o.col <= 620 && o.font >= 18 && !o.over
          && scrolled.top > 0 && scrolled.y === before.y && Number(scrolled.bar) > 0
          && nextStory.story === 4 && nextStory.count === '5 of 17' && nextStory.title !== wantTitle && nextStory.top === 0 && nextStory.y === before.y
          && closed.hidden && closed.focusIsExpand && closed.y === before.y
        row(`creative: full screen story reader (${w}x${h})`, ok, JSON.stringify({ o: { ...o, html: o.html.length }, scrolled, nextStory, closed, before }).slice(0, 420))
      }
      // the photographs: Priaprizm's card and Colorpulse's tape both show their picture, inside the room
      for (const [w,h] of [[1440,813],[1280,720],[1024,768],[390,844]]) {
        await s.openEngine(join('p=5'),w,h)
        await s.evaluate(`document.getElementById('creative-tab-music').click(); document.getElementById('music-tab-priaprizm').click()`)
        await until(() => s.evaluate(`(() => { const i=document.querySelector('.priaprizm-card img'); return i.complete && i.naturalWidth>0 })()`), 5000)
        const pr = await s.evaluate(`(() => { const i=document.querySelector('.priaprizm-card img'), r=i.getBoundingClientRect(), w=document.getElementById('creative-music').getBoundingClientRect(); return { loaded:i.complete&&i.naturalWidth>0, h:r.height, inside:r.left>=w.left-1&&r.right<=w.right+1&&r.top>=w.top-1&&r.bottom<=w.bottom+1, alt:i.alt.length>8 } })()`)
        await s.evaluate(`document.getElementById('music-tab-colorpulse').click()`)
        const cp = await s.evaluate(`(() => { const a=document.querySelector('.tape-leaf:not([hidden]) .tape-art'), r=a.getBoundingClientRect(), w=document.getElementById('creative-music').getBoundingClientRect(); return { bg:getComputedStyle(a).backgroundImage.includes('colorpulse'), inside:r.left>=w.left-1&&r.right<=w.right+1&&r.top>=w.top-1&&r.bottom<=w.bottom+1, h:r.height } })()`)
        row(`creative: Priaprizm and Colorpulse photographs (${w}x${h})`, pr.loaded && pr.alt && pr.inside && pr.h >= 60 && cp.bg && cp.inside && cp.h >= 80, JSON.stringify({ pr, cp }))
      }
      // a continuous wheel (a trackpad) over a reading card or the Creative room still carries the page on
      {
        await s.viewport(1440,813); await s.open(`${origin}/?ss-debug`); await sleep(5000)
        const stuck = []
        for (const [id, sel] of [['essays','#essays .essay-card'],['creative','#creative .creative-inner'],['creative','#creative .story-index']]) {
          await s.evaluate(`scrollTo(0,0)`); await sleep(300)
          await s.evaluate(`document.querySelector('.hud-nav a[href="#${id}"]').click()`); await sleep(2500)
          const at = await s.evaluate(`(() => { const b=document.querySelector('${sel}').getBoundingClientRect(); return { x:b.left+b.width/2, y:b.top+b.height/2, sy:scrollY } })()`)
          for (let i=0;i<150;i++) { await s.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:at.x,y:at.y,deltaX:0,deltaY:60}); await sleep(16) }
          await sleep(400)
          const end = await s.evaluate('scrollY')
          if (end - at.sy < 400) stuck.push(`${sel}: ${at.sy} to ${end}`)
        }
        row('creative: continuous wheel over cards carries the page on', !stuck.length, stuck.join('; ') || 'essay card, Creative room and story list all hand off')
      }
    })

    // ---------------------------------------------------------------- stories
    await group('stories', async () => {
      // The visible story panel preserves the source order and links nowhere (the Writing page is retired from the surface).
      await s.openEngine(join(`p=${LEGEND.indexOf('Creative')}`)); await sleep(200)
      const r = await s.evaluate(`({ titles:[...document.querySelectorAll('#creative .story-leaf h4')].map(x=>x.textContent.trim()), nums:[...document.querySelectorAll('#creative .story-leaf .story-number')].map(x=>x.textContent.trim()), choices:document.querySelectorAll('#creative .story-choice').length, links:[...document.querySelectorAll('#creative .story-leaf a')].map(x=>x.getAttribute('href')) })`)
      row('writing: every story, in order', r.titles.join('|') === STORIES.join('|') && r.nums.join('|') === STORIES.map((_, i) => String(i + 1).padStart(2, '0')).join('|') && r.choices === STORIES.length && r.links.length === 0, `${r.choices} choices, ${r.links.length} links`)
      // nothing on the home surface leads to the retired pages (the menu and its routes are off the surface)
      const retired = await s.evaluate(`[...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => /^(?:https?:\\/\\/(?:www\\.)?nichalasbarnes\\.com)?\\/(about|projects|writing|changelog|contact|newsletter|work-with-me)(?:[\\/#?]|$)/.test(h))`)
      row('no link to the retired pages', retired.length === 0, retired.length ? retired.join(', ') : 'no anchor leads to the old menu pages')
    })

    // ---------------------------------------------------------------- the newsletter orbit and reader
    await group('orbit', async () => {
      await s.openEngine(page)
      // the planet is absent a station away, there on the approach and the leave, full at the hold with the newest at the front
      const orb = []
      for (const d of [-0.9, -0.3, 0, 0.3, 0.9]) { await s.goto(NEWS + d); await sleep(160); orb.push({ d, ...(await s.evaluate(ORBIT)) }) }
      const orbOk = orb[0].planetA < 0.05 && orb[4].planetA < 0.05 && orb[1].planetA > 0.3 && orb[3].planetA > 0.3 && orb[2].planetA > 0.9 && orb[2].front === 0 && orb[2].moons >= 5 && orb[2].tags >= 5 && orb[2].tagsIn
      row('newsletter orbit blend', orbOk, orb.map(o => `${o.d >= 0 ? '+' : ''}${o.d}: planet ${o.planetA}, sun ${o.theta}deg, ${o.moons} of ${o.n} moons, ${o.tags} tags${o.tags && !o.tagsIn ? ' (off screen)' : ''}`).join('; '))

      // every letter is reachable by the orbit: at the front its moon is in view, tagged, its row lit, the counter naming it
      await s.goto(NEWS); await sleep(160)
      const nLetters = await s.evaluate('__ss.orbit.n')
      const reach = []
      for (let k = 0; k < nLetters; k++) {
        await s.evaluate(`__ss.orbitTo(${k})`); await sleep(60); await s.frames(2)
        const o = await s.evaluate(REACH)
        if (!(o.front === k && o.vis > 0.5 && o.tag && o.row === k && o.pos === `No. ${o.num} of ${o.n}`)) reach.push(`${k}: ${JSON.stringify(o)}`)
      }
      row('newsletter: every letter reachable', !reach.length && nLetters === ISSUES.length, `${nLetters} letters on the station, ${ISSUES.length} in content/newsletter; ${reach.join('; ') || 'all reachable'}`)

      // the reader shows the front letter's whole text, block by block against the markdown, and starts at the top on each change
      const text = []
      for (let k = 0; k < nLetters; k++) {
        await s.evaluate(`__ss.orbitTo(${k})`); await sleep(60); await s.frames(2)
        const r = await s.evaluate(READ), x = ISSUES[k]
        await s.evaluate(`(b => { b.scrollTop = 300; })(${FRONT_BODY})`)
        const sameBlocks = x && r.blocks.length === x.blocks.length && r.blocks.every((b, i) => b.kind === x.blocks[i].kind && b.text === x.blocks[i].text && (b.kind !== 'img' || b.file === x.blocks[i].file))
        const same = sameBlocks && r.k === k && r.shown === 1 && r.alpha === '1' && r.labelled && r.region && r.scrollable && r.top === 0 && !r.emdash && r.links && r.meta === x.meta && r.title === x.title && r.deck === x.deck && r.week === x.week
        if (!same) {
          const at = r.blocks.findIndex((b, i) => !x?.blocks[i] || b.kind !== x.blocks[i].kind || b.text !== x.blocks[i].text || (b.kind === 'img' && b.file !== x.blocks[i].file))
          text.push(`${k}: ${JSON.stringify({ ...r, blocks: r.blocks.length }).slice(0, 260)} wants ${JSON.stringify({ meta: x?.meta, title: x?.title, week: x?.week, blocks: x?.blocks.length })}${sameBlocks ? '' : `; first different block ${at}: ${JSON.stringify(r.blocks[at]).slice(0, 120)} vs ${JSON.stringify(x?.blocks[at]).slice(0, 120)}`}`)
        }
      }
      row('reader shows the whole letter', !text.length, text.join('; ').slice(0, 600) || `${nLetters} letters, blocks ${ISSUES.map(x => x.blocks.length).join(' ')}`)

      // no dive from the Newsletter: the front tag, chip and moon and Enter open nothing; another chip turns the ring
      await s.openEngine(page)
      await s.goto(NEWS); await sleep(300)
      const front = await s.evaluate('__ss.orbit.front')
      const NOD = "({ active: __ss.diveState.active, hidden: document.getElementById('detail').hidden, locked: document.documentElement.classList.contains('locked'), dialogs: [...document.querySelectorAll('[role=dialog]')].filter(d => !d.hidden).length, front: __ss.orbit.front, sp: Number(__ss.sp.toFixed(2)) })"
      const pos = await s.evaluate(`__ss.bodyPos('newsletter', ${front})`)
      const opened = []
      const acts = [
        ['the front tag', () => s.evaluate(`document.querySelectorAll('.ss .moon-tag')[${front}].click()`)],
        ['the front chip', () => s.evaluate(`document.querySelector('.ss #newsletter .pieces li a[data-k="${front}"]').click()`)],
        ['the front moon', () => s.mouse(Math.round(pos.x), Math.round(pos.y))],
        ['Enter', async () => { await s.evaluate('document.activeElement && document.activeElement.blur && document.activeElement.blur()'); await s.key('Enter', 13, 0) }],
      ]
      for (const [label, act] of acts) { await act(); await sleep(600); const r = await s.evaluate(NOD); if (r.active || !r.hidden || r.locked || r.dialogs || r.front !== front || r.sp !== NEWS) opened.push(`${label}: ${JSON.stringify(r)}`) }
      await s.evaluate(`document.querySelector('.ss #newsletter .pieces li a[data-k="${front + 3}"]').click()`); await sleep(1200)
      const r = await s.evaluate(NOD)
      const turned = r.front === front + 3 && !r.active && r.hidden && !r.dialogs
      row('newsletter: no dive', !opened.length && turned, `${opened.join('; ') || 'tag, chip, moon and Enter open nothing'}; a chip three older turns the ring: ${turned}`)
    })

    // ---------------------------------------------------------------- wheel, keys and touch at the Newsletter
    await group('gestures', async () => {
      const wheel = async (dx, dy, n, x = 900, y = 450, gap = 40) => { for (let i = 0; i < n; i++) { await s.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: dx, deltaY: dy }); await sleep(gap) } }
      // sideways input turns the ring and leaves the page; vertical input scrolls the page and leaves the ring
      await s.openEngine(page)
      await s.evaluate(at(NEWS)); await sleep(1400)
      const g0 = await s.evaluate(STATE)
      await wheel(-120, 0, 6); await sleep(900); const g1 = await s.evaluate(STATE)
      await wheel(0, 120, 3); await sleep(900); const g2 = await s.evaluate(STATE)
      await s.key('ArrowLeft', 37); const g3 = await s.evaluate(STATE)
      await s.key('ArrowRight', 39); const g4 = await s.evaluate(STATE)
      await s.evaluate(at(NEWS - 2)); await sleep(1400)
      const g5 = await s.evaluate(STATE)
      await wheel(-120, 0, 3); await sleep(900); const g6 = await s.evaluate(STATE)
      const gestureOk = g1.y === g0.y && Math.abs(g1.sp - g0.sp) < 0.05 && g1.front > g0.front && g1.consumed === 6 && g1.settled
        && g2.y > g1.y && g2.front === g1.front && g2.ignored === g1.ignored + 3
        && g3.front === g2.front + 1 && g3.y === g2.y && g4.front === g3.front - 1
        && g6.front === g5.front && g6.consumed === g5.consumed && g6.y === g5.y
      row('sideways input orbits, vertical scroll untouched', gestureOk, `hold y ${g0.y} front ${g0.front}; 6 sideways: y ${g1.y}, front ${g1.front}, consumed ${g1.consumed}, settled ${g1.settled}; 3 vertical: y ${g2.y}, front ${g2.front}, ignored ${g2.ignored}; Left then Right: ${g3.front} then ${g4.front}; away: front ${g5.front} to ${g6.front}`)

      // the wheel over the letter's text: the text first, the page after a 350 ms pause at its end
      await s.evaluate(at(NEWS)); await sleep(1400)
      const bodyAt = await s.evaluate(`(r => ({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }))(${FRONT_BODY}.getBoundingClientRect())`)
      const r0 = await s.evaluate(RSTATE)
      await wheel(0, 120, 3, bodyAt.x, bodyAt.y); await sleep(200); const r1 = await s.evaluate(RSTATE)
      await wheel(0, 400, 40, bodyAt.x, bodyAt.y, 30); await sleep(100); const r2 = await s.evaluate(RSTATE)
      await sleep(450); await wheel(0, 120, 3, bodyAt.x, bodyAt.y); await sleep(900); const r3 = await s.evaluate(RSTATE)
      await s.evaluate(at(NEWS)); await sleep(1400)
      const r4 = await s.evaluate(RSTATE)
      await wheel(-120, 0, 6, bodyAt.x, bodyAt.y); await sleep(900); const r5 = await s.evaluate(RSTATE)
      await s.evaluate(`${FRONT_BODY}.focus()`)
      await s.key('ArrowLeft', 37); const r6 = await s.evaluate(RSTATE)
      await s.key('ArrowDown', 40); const r7 = await s.evaluate(RSTATE)
      const handoffOk = r1.y === r0.y && r1.scroll > r0.scroll && r1.wheeled === r0.wheeled + 3
        && r2.y === r0.y && r2.held > 0 && r2.passed === r0.passed
        && r3.y > r0.y && r3.passed >= 1
        && r5.y === r4.y && r5.front > r4.front
        && r6.focused && r6.front === r5.front + 1 && r6.y === r4.y
        && r7.scroll > 0 && r7.y === r4.y
      row('wheel over the letter: text first, page after 350 ms', handoffOk, `3 wheels: text ${r0.scroll} to ${r1.scroll}, page ${r0.y} to ${r1.y}; 40 to the end: text ${r2.scroll}, page ${r2.y}, held ${r2.held}; after 450 ms: page ${r3.y}, passed ${r3.passed}; sideways: front ${r4.front} to ${r5.front}; focused Left then Down: front ${r6.front}, text ${r7.scroll}, page ${r7.y}`)

      // the reader follows the ring, and the live region names the letter once per settle
      await s.openEngine(page)
      await s.evaluate(at(NEWS)); await sleep(1400)
      const n0 = await s.evaluate(ANNOUNCE)
      await s.evaluate('__ss.orbitTo(5)'); await sleep(1800); const n1 = await s.evaluate(ANNOUNCE)
      await wheel(-120, 0, 6); await sleep(1900); const n2 = await s.evaluate(ANNOUNCE)   // the prototype's wheel() ends with 900 ms, then 1000
      const announceOk = n1.announced === n0.announced + 1 && n1.active === 5 && n1.front === 5 && n1.text.startsWith(`No. ${ISSUES[5].num},`) && n1.alpha > 0.95
        && n2.announced === n0.announced + 2 && n2.active === n2.front && n2.front === 9 && n2.text.startsWith(`No. ${ISSUES[9].num},`) && n2.alpha > 0.95
      row('reader follows the ring, announced once per settle', announceOk, `hold: announced ${n0.announced}, letter ${n0.active}; turned to 5: announced ${n1.announced}, reader on ${n1.active} at ${n1.alpha}, said "${n1.text}"; four by wheel: announced ${n2.announced}, reader on ${n2.active} at ${n2.alpha}, said "${n2.text}"`)

      // touch on a phone: a sideways swipe on the text turns the ring, a vertical one scrolls the text, below the panel the page
      await s.openEngine(page, 390, 844)
      await s.evaluate(at(NEWS)); await sleep(1400)
      const swipe = async (x0, y0, x1, y1) => {
        await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] })
        for (let i = 1; i <= 8; i++) { await s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / 8, y: y0 + (y1 - y0) * i / 8 }] }); await sleep(30) }
        await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900)
      }
      const body = await s.evaluate(`(r => ({ x: Math.round(r.left + r.width / 2), top: Math.round(r.top), bottom: Math.round(r.bottom) }))(${FRONT_BODY}.getBoundingClientRect())`)
      const t0 = await s.evaluate(TSTATE)
      await swipe(body.x - 80, body.top + 40, body.x + 130, body.top + 44); const t1 = await s.evaluate(TSTATE)
      await swipe(body.x, body.bottom - 20, body.x + 4, body.top + 20); const t2 = await s.evaluate(TSTATE)
      const below = await s.evaluate("(r => Math.round(r.bottom))(document.querySelector('.ss #newsletter .reader').getBoundingClientRect())")
      await swipe(200, below + 30, 204, below - 170); const t3 = await s.evaluate(TSTATE)
      const touchOk = t1.y === t0.y && t1.front > t0.front && t1.consumed > t0.consumed && t2.y === t1.y && t2.scroll > t1.scroll && t2.front === t1.front && t3.y > t2.y && t3.front === t2.front
      row('touch: sideways swipe orbits, vertical scrolls text then page (390)', touchOk, `hold y ${t0.y} front ${t0.front}; sideways on the text: y ${t1.y}, front ${t1.front}; vertical on the text: y ${t2.y}, text ${t1.scroll} to ${t2.scroll}; below the panel: y ${t3.y}, front ${t3.front}`)
      await s.viewport(1440, 900)
    })

    // ---------------------------------------------------------------- links row
    await group('links', async () => {
      for (const [w, h] of SIZES) {
        await s.openEngine(page, w, h)
        const bad = []
        let hrefsOk = true, namesOk = true, width = 0
        for (let i = 0; i < LEGEND.length; i++) {
          await s.goto(i); await sleep(100)
          const r = await s.evaluate(SOCIAL)
          if (r.hrefs.join('|') !== SOCIAL_LINKS.join('|')) hrefsOk = false
          if (r.labels.join('|') !== SOCIAL_LABELS.join('|') || r.titles.join('|') !== SOCIAL_LABELS.join('|') || r.words.join('|') !== SOCIAL_WORDS.join('|')) namesOk = false
          width = r.width
          if (!r.ok) bad.push(`${i}: ${r.visible ? '' : 'hidden '}${r.inside ? '' : 'outside '}${r.over ? 'under ' + r.over : ''}${r.newTab ? '' : ' not a new tab'}${r.marks ? '' : ' marks not drawn'}${r.targets ? '' : ' targets under 24px or touching'}${r.oneLine ? '' : ' wraps'}${r.supportPx >= 11 ? '' : ' Support under 11px'}`)
        }
        row(`links on every scene (${w}x${h})`, !bad.length && hrefsOk && namesOk, `${hrefsOk ? 'the five links' : 'hrefs differ'}, ${namesOk ? 'named' : 'names differ'}, row ${width}px; ${bad.join('; ') || 'clear at all 11'}`)
      }
      for (const [w, h] of [[1440, 900], [1024, 768], [390, 844]]) {
        await s.openEngine(join(`p=${LEGEND.indexOf('Tools and games')}&dive=t1&dt=1`), w, h); await sleep(200)
        const r = await s.evaluate(SOCIAL)
        row(`links while a detail is open (${w}x${h})`, r.ok, `visible ${r.visible}, inside ${r.inside}, under ${r.over || 'nothing'}`)
      }
    })

    // ---------------------------------------------------------------- the reader panel at the hold
    await group('panel', async () => {
      for (const [w, h, extra] of [...SIZES.map(([w, h]) => [w, h, '']), [1440, 900, 'nogl=1']]) {
        await s.openEngine(join([`p=${NEWS}`, extra].filter(Boolean).join('&')), w, h); await sleep(250)
        const r = await s.evaluate(PANEL)
        row(`reader at the hold (${w}x${h}${extra ? ', Canvas2D' : ''})`, r.ok, `${r.renderer}, panel ${r.size}, ${r.lines} lines at ${r.px}px, scrolls ${r.scrollable}, inside ${r.inside}, under ${r.over || 'nothing'}`)
      }
    })

    // ---------------------------------------------------------------- Projects planet carousel
    await group('projects', async () => {
      const atProjects = join(`p=${LEGEND.indexOf('Projects')}`)
      await s.openEngine(atProjects)
      const initial = await s.evaluate(`(() => ({ names: [...document.querySelectorAll('#projects .project-moon')].map(b => b.querySelector('.project-tag').textContent), current: __ss.projectCarousel.current, live: document.getElementById('orbit-announce').getAttribute('aria-live'), panel: document.querySelector('#projects .project-panel').getAttribute('aria-label'), dive: __ss.detailSets.includes('projects') }))()`)
      row('moons reachable', initial.names.join('|') === PROJECT_NAMES.join('|') && initial.current === 0 && initial.live === 'polite' && initial.panel === 'Active project', JSON.stringify(initial))
      for (const [w, h] of [[1440, 813], [1280, 720], [1024, 768], [390, 844]]) {
        await s.openEngine(atProjects, w, h)
        const fit = await s.evaluate(`(() => { const box = q => { const r = document.querySelector(q).getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom } }; return { globe:box('#projects .project-globe'), panel:box('#projects .project-panel'), controls:box('#projects .project-controls'), hud:box('.hud-nav'), header:box('.hud-top'), moons:[...document.querySelectorAll('#projects .project-moon')].filter(m => { const c = getComputedStyle(m); return c.display !== 'none' && c.visibility !== 'hidden' && Number(c.opacity) > 0.1 }).map(m => { const r = m.getBoundingClientRect(); return { name:m.textContent.trim(), left:r.left, right:r.right, top:r.top, bottom:r.bottom } }) } })()`)
        const g = fit.globe, p = fit.panel, c = fit.controls, hud = fit.hud, header = fit.header
        const apart = (a, b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top
        row(`planet fully visible (${w}x${h})`, g.left >= 0 && g.right <= w && g.top >= header.bottom && g.bottom <= hud.top && apart(g, p) && apart(g, c) && p.right <= w && p.bottom <= hud.top, JSON.stringify(fit))
        const strayMoons = fit.moons.filter(m => !(m.left >= 0 && m.right <= w && m.top >= 0 && m.bottom <= hud.top && apart(m, c) && apart(m, p)))
        row(`moons on screen (${w}x${h})`, strayMoons.length === 0 && fit.moons.length >= 4, strayMoons.map(m => `${m.name} ${Math.round(m.left)},${Math.round(m.top)}-${Math.round(m.right)},${Math.round(m.bottom)}`).join('; ') || `${fit.moons.length} moons clear of the edges, legend, controls and panel`)
      }
      await s.openEngine(atProjects, 1280, 720)
      const tall = []
      for (let k = 0; k < PROJECT_NAMES.length; k++) {
        await s.evaluate(`__ss.projectTo(${k})`); await sleep(500)
        const r = await s.evaluate(`(() => { const p = document.querySelector('#projects .project-panel').getBoundingClientRect(), h = document.querySelector('.hud-nav').getBoundingClientRect(), t = document.querySelector('.hud-top').getBoundingClientRect(); return { top:p.top, bottom:p.bottom, hud:h.top, head:t.bottom } })()`)
        if (r.bottom > r.hud || r.top < r.head) tall.push(`${PROJECT_NAMES[k]} ${Math.round(r.top)}-${Math.round(r.bottom)} (legend ${Math.round(r.hud)})`)
      }
      row('panel fits for every project (1280x720)', tall.length === 0, tall.join('; ') || 'seven panels between the header and the legend')
      await s.openEngine(atProjects)
      const badText = [], badVideo = [], ghosts = []
      await s.evaluate('__ss.projectTo(1)'); await sleep(300) // so the first step is a real change and announces
      for (let k = 0; k < PROJECT_NAMES.length; k++) {
        await s.evaluate(`__ss.projectTo(${k})`); await sleep(500)
        const state = await s.evaluate(`(() => { const leaves = [...document.querySelectorAll('#projects .project-leaf')], a = leaves.find(x => !x.hidden && !x.classList.contains('outgoing')), vids = leaves.map((x, k) => ({ k, src: x.querySelector('video')?.getAttribute('src') || '', playing: !!x.querySelector('video') && !x.querySelector('video').paused })); return { current: __ss.projectCarousel.current, name: a.querySelector('h3').textContent, description: a.querySelector('.project-more > p').textContent, medium: a.querySelector('.lab').textContent, visible: leaves.filter(x => !x.hidden).length, links: [...a.querySelectorAll('.project-actions a')].map(x => x.textContent.trim()), video: vids, moon: document.querySelectorAll('#projects .project-moon[aria-current="true"]').length, announce: document.getElementById('orbit-announce').textContent } })()`)
        if (state.name !== PROJECT_NAMES[k] || state.description !== PROJECT_DESCRIPTIONS[state.name] || state.current !== k) badText.push(`${k}: ${state.name}: ${state.description.slice(0, 40)}`)
        if (state.visible !== 1 || state.moon !== 1 || !state.announce.includes(state.name)) ghosts.push(`${k}: ${state.visible} leaves, ${state.moon} front moons, ${state.announce}`)
        const videoWanted = !['Cerebro', 'Job Toast'].includes(state.name)
        if (state.video.filter(v => v.src).length !== (videoWanted ? 1 : 0) || state.video.some(v => v.k !== k && (v.src || v.playing))) badVideo.push(`${k}: ${JSON.stringify(state.video)}`)
        if (state.name === 'Cerebro' && state.links.join('|') !== 'Download↗|Site↗') badText.push(`Cerebro links ${state.links.join('|')}`)
        if (state.name === 'Brain Atlas' && !state.links[0].startsWith('Live')) badText.push('Brain Atlas live label')
      }
      row('panel equals data', !badText.length, badText.join('; ') || 'seven full descriptions, media labels and links')
      row('video active only', !badVideo.length, badVideo.join('; ') || 'inactive videos have no source')
      row('no panel ghost', !ghosts.length, ghosts.join('; ') || 'one visible panel and one front moon at each step')
      await s.evaluate('__ss.projectTo(6)'); await sleep(80)
      await s.key('ArrowRight', 39, 80)
      const forward = await s.evaluate('__ss.projectCarousel.current')
      await s.key('ArrowLeft', 37, 80)
      const backward = await s.evaluate('__ss.projectCarousel.current')
      await s.evaluate('__ss.projectTo(0)'); await sleep(80)
      await s.key('ArrowLeft', 37, 80)
      const reverse = await s.evaluate('__ss.projectCarousel.current')
      row('wraps both ways', forward === 0 && backward === 6 && reverse === 6, `${forward}, ${backward}, ${reverse}`)
      await s.evaluate('__ss.projectTo(0)'); await sleep(100)
      await s.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 400, y: 400, deltaX: 120, deltaY: 0 }); await sleep(100)
      const wheel = await s.evaluate('__ss.projectCarousel.current')
      await s.key('ArrowRight', 39, 80)
      const key = await s.evaluate('__ss.projectCarousel.current')
      row('wheel and keys turn', wheel === 1 && key === 2, `wheel ${wheel}, key ${key}`)
      const noDive = await s.evaluate(`({ detail: document.getElementById('detail').hidden, active: __ss.diveState.active, included: __ss.detailSets.includes('projects') })`)
      row('projects: no dive', noDive.detail && !noDive.active && !noDive.included, JSON.stringify(noDive))
      await s.openEngine(atProjects, 390, 844)
      const phone = await s.evaluate(`(() => { const r = document.querySelector('#projects .project-panel').getBoundingClientRect(), g = document.querySelector('#projects .project-globe').getBoundingClientRect(), hud = document.querySelector('.hud-nav').getBoundingClientRect(), panel = document.querySelector('#projects .project-panel'); return { panel: [r.left,r.top,r.right,r.bottom], globe: [g.top,g.bottom], hud: hud.top, scroll: panel.scrollHeight > panel.clientHeight, text: parseFloat(getComputedStyle(panel.querySelector('.project-more > p')).fontSize), overflow: document.documentElement.scrollWidth > innerWidth } })()`)
      row('phone fit', phone.panel[0] >= 0 && phone.panel[2] <= 390 && phone.panel[1] >= phone.globe[1] && phone.panel[3] <= phone.hud && phone.text >= 11 && !phone.overflow, JSON.stringify(phone))
      await s.openEngine(join(`p=${LEGEND.indexOf('Projects')}&rm=1`))
      const calm = await s.evaluate(`(() => { const v = [...document.querySelectorAll('#projects video')]; return v.every(x => !x.getAttribute('src') && x.paused) })()`)
      row('projects: reduced motion stills', calm, `video sources absent: ${calm}`)
    })

    // ---------------------------------------------------------------- contact form
    await group('contact', async () => {
      await s.openEngine(join(`p=${LEGEND.indexOf('Contact')}`))
      const fields = await s.evaluate(`(() => { const f = document.querySelector('#contact form'); return { named:f?.getAttribute('name'), registration:f?.hasAttribute('data-netlify'), hidden:f?.querySelector('[name="form-name"]')?.value, honeypot:!!f?.querySelector('[name="bot-field"]'), labels:[...f.querySelectorAll('label')].map(x => x.textContent.trim()), required:f.querySelector('[name="email"]')?.required, address:document.querySelector('.ss').textContent.includes('colorpulse@gmail.com') || !!document.querySelector('.ss a[href^="mailto:"]') } })()`)
      row('contact form and fields', fields.named === 'contact' && fields.hidden === 'contact' && fields.honeypot && fields.required && !fields.registration && !fields.address && fields.labels.join('|') === 'Your Name|Your Email|Message', JSON.stringify(fields))
      for (const [w, h] of [[1440, 813], [1024, 768], [390, 844]]) {
        await s.openEngine(join(`p=${LEGEND.indexOf('Contact')}`), w, h)
        const fit = await s.evaluate(`(() => { const r = document.querySelector('#contact .contact-form').getBoundingClientRect(), head = document.querySelector('.hud-top').getBoundingClientRect(), nav = document.querySelector('.hud-nav').getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, head:head.bottom, nav:nav.top, font:parseFloat(getComputedStyle(document.querySelector('#contact label')).fontSize) } })()`)
        row(`contact form fits (${w}x${h})`, Math.abs((fit.left + fit.right) / 2 - w / 2) <= 6 && fit.left >= 0 && fit.right <= w && fit.top >= fit.head && fit.bottom <= fit.nav && fit.font >= 11, JSON.stringify(fit))
      }
      await s.openEngine(join(`p=${LEGEND.indexOf('Contact')}`))
      await s.evaluate(`document.querySelector('#scroll-contact-name').focus()`)
      await s.send('Input.insertText', { text: 'Nic Test' })
      await s.key('ArrowLeft', 37, 40)
      await s.send('Input.insertText', { text: ' ' })
      const typing = await s.evaluate(`({ name: document.querySelector('#scroll-contact-name').value, focus: document.activeElement.id, sp: __ss.sp })`)
      row('contact typing keeps engine still', typing.name === 'Nic Tes t' && typing.focus === 'scroll-contact-name' && Math.abs(typing.sp - LEGEND.indexOf('Contact')) < .05, JSON.stringify(typing))
      await s.evaluate(`document.querySelector('#scroll-contact-email').focus()`)
      await s.send('Input.insertText', { text: 'nic@example.test' })
      await s.evaluate(`document.querySelector('#scroll-contact-message').focus()`)
      await s.send('Input.insertText', { text: 'A project idea' })
      const posts = []
      s.on('Fetch.requestPaused', p => {
        if (p.request.method === 'POST' && new URL(p.request.url).pathname === '/') {
          posts.push({ url:p.request.url, body:p.request.postData, headers:p.request.headers })
          s.send('Fetch.fulfillRequest', { requestId:p.requestId, responseCode:200, responseHeaders:[{ name:'Content-Type', value:'text/plain' }], body:Buffer.from('ok').toString('base64') }).catch(() => {})
        } else if (p.request.method === 'POST') s.send('Fetch.failRequest', { requestId:p.requestId, errorReason:'Aborted' }).catch(() => {})
        else s.send('Fetch.continueRequest', { requestId:p.requestId }).catch(() => {})
      })
      await s.send('Fetch.enable', { patterns:[{ urlPattern:'*', requestStage:'Request' }] })
      try {
        await s.click('#contact button[type="submit"]')
        await until(() => s.evaluate(`!!document.querySelector('#contact [role="status"]')?.textContent.includes('Message sent.')`), 3000)
      } finally { await s.send('Fetch.disable'); s.off('Fetch.requestPaused') }
      const body = new URLSearchParams(posts[0]?.body || '')
      row('contact posts typed values only to intercepted Netlify form', posts.length === 1 && body.get('form-name') === 'contact' && body.get('bot-field') === '' && body.get('name') === 'Nic Tes t' && body.get('email') === 'nic@example.test' && body.get('message') === 'A project idea', JSON.stringify(posts.map(p => ({ url:p.url, body:p.body }))))
      const sent = await s.evaluate(`document.querySelector('#contact [role="status"]')?.textContent.trim()`)
      row('contact sent inline', sent === 'Message sent. I will get back to you soon.', sent)
      await s.openEngine(join(`p=${LEGEND.indexOf('Contact')}`))
      await s.evaluate(`(() => { const input = document.querySelector('#scroll-contact-email'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, 'nic@example.test'); input.dispatchEvent(new Event('input', { bubbles:true })); const box = document.querySelector('#scroll-contact-message'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(box, 'Keep this draft'); box.dispatchEvent(new Event('input', { bubbles:true })); })()`)
      let rejected = 0
      s.on('Fetch.requestPaused', p => {
        if (p.request.method === 'POST') { rejected++; s.send('Fetch.fulfillRequest', { requestId:p.requestId, responseCode:500, body:Buffer.from('error').toString('base64') }).catch(() => {}) }
        else s.send('Fetch.continueRequest', { requestId:p.requestId }).catch(() => {})
      })
      await s.send('Fetch.enable', { patterns:[{ urlPattern:'*', requestStage:'Request' }] })
      try {
        await s.click('#contact button[type="submit"]')
        await until(() => s.evaluate(`document.querySelector('#contact .contact-status.error')?.textContent.includes('Something went wrong')`), 3000)
      } finally { await s.send('Fetch.disable'); s.off('Fetch.requestPaused') }
      const retained = await s.evaluate(`({ email:document.querySelector('#scroll-contact-email')?.value, message:document.querySelector('#scroll-contact-message')?.value, error:document.querySelector('#contact .contact-status.error')?.textContent })`)
      row('contact error keeps the draft', rejected === 1 && retained.email === 'nic@example.test' && retained.message === 'Keep this draft' && /Something went wrong/.test(retained.error), JSON.stringify(retained))
    })

    // ---------------------------------------------------------------- dives on the remaining detail scenes
    await group('dives', async () => {
      // in, landed, out, with the scroll position intact
      const DIVES = [
        ['tools', 1440, 900, 'tools', "__ss.dive(0, 'tools')", ''], ['tools (390)', 390, 844, 'tools', "__ss.dive(4, 'tools')", ''],
        ['changelog', 1440, 900, 'changelog', "__ss.dive(1, 'changelog')", ''], ['changelog (390)', 390, 844, 'changelog', "__ss.dive(5, 'changelog')", ''],
      ]
      for (const [label, w, h, sceneId, call, extra] of DIVES) {
        await s.openEngine(extra ? join(extra) : page, w, h)
        const scene = await s.evaluate(`__ss.scenes.findIndex(x => x.id === '${sceneId}')`)
        await s.evaluate(at(scene)); await sleep(1400)
        const sp0 = Number((await s.evaluate('__ss.sp')).toFixed(2))
        await s.evaluate(call)
        await until(() => s.evaluate('__ss.diveState.active'), 2500, 50)
        await sleep(300)
        const mid = await s.evaluate("({ t: Number(__ss.diveState.t.toFixed(2)), locked: document.documentElement.classList.contains('locked'), k: __ss.diveState.k, set: __ss.diveState.set })")
        await sleep(1100)
        const landed = await s.evaluate("({ open: __ss.diveState.open, opacity: getComputedStyle(document.getElementById('detail')).opacity, title: document.getElementById('detail-title').textContent, focus: document.activeElement.id, cardIn: (r => r.left >= 0 && r.right <= innerWidth)(document.querySelector('.ss .detail-card').getBoundingClientRect()) })")
        await s.evaluate("document.getElementById('detail-back').click()")
        await sleep(1400)
        const after = await s.evaluate("({ active: __ss.diveState.active, hidden: document.getElementById('detail').hidden, locked: document.documentElement.classList.contains('locked'), sp: Number(__ss.sp.toFixed(2)) })")
        const ok = mid.locked && landed.open && landed.opacity === '1' && landed.focus === 'detail-back' && landed.cardIn && !after.active && after.hidden && !after.locked && after.sp === scene
        row(`dive: ${label}`, ok, `sp ${sp0}, t at 0.3 s ${mid.t}, locked ${mid.locked}; landed open ${landed.open} at opacity ${landed.opacity}, "${landed.title}", focus ${landed.focus}, card in view ${landed.cardIn}; closed ${!after.active && after.hidden && !after.locked}, sp after ${after.sp}`)
      }
      await s.viewport(1440, 900)


    })

    // ---------------------------------------------------------------- a forced context loss
    await group('context', async () => {
      // Canvas2D takes over for the rest of the visit, the note says so, and the stations still travel
      expected = [/CONTEXT_LOST_WEBGL/i, /WebGL context lost/i]
      try {
        await s.openEngine(join(`p=${LEGEND.indexOf('Projects')}`))
        const before = await s.evaluate('__ss.renderer')
        const fpsBefore = await s.evaluate(`new Promise(done => { const f0 = __ss.frames; setTimeout(() => done(__ss.frames - f0), 1000) })`)
        await s.evaluate("document.querySelector('.ss #sky').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()")
        const switched = await until(() => s.evaluate("__ss.renderer === 'canvas2d'"), 3000, 50)
        await sleep(500)
        const f0 = await s.evaluate('__ss.frames'); await sleep(1000); const fps = await s.evaluate('__ss.frames') - f0
        await s.goto(NEWS); await sleep(300)
        const state = await s.evaluate("({ renderer: __ss.renderer, skies: document.querySelectorAll('.ss canvas#sky').length, drawn: !!document.querySelector('.ss #sky').getContext('2d'), note: (f => f.hidden ? '' : f.textContent)(document.getElementById('fallback')), sp: Number(__ss.sp.toFixed(2)), ghosts: 0 })")
        const ghost = await s.evaluate(GHOSTS)
        const ok = before === 'webgl2' && switched && fps >= 10 && state.skies === 1 && state.drawn && /context lost/i.test(state.note) && state.sp === NEWS && !ghost.out.length
        row('context loss', ok, `${before} to ${state.renderer} (${switched ? 'switched' : 'not switched'}), ${fpsBefore} frames in 1 s before, ${fps} after, one sky ${state.skies === 1}, note "${state.note}", travels to sp ${state.sp}, ghosts ${ghost.out.join(' ') || 'none'}; expected messages: ${expectedSeen.join(' | ') || 'none'}`)
      } finally { await sleep(300); expected = [] }
    })

    // ---------------------------------------------------------------- accessibility
    await group('a11y', async () => {
      await s.openEngine(page)
      // names: scenes labelled, marks named or hidden, every link and button named, letter regions labelled, the dialog modal
      const names = await s.evaluate(`(() => {
        const named = (el) => !!(el.textContent.trim() || el.getAttribute('aria-label') || el.getAttribute('title'));
        return {
          scenes: [...document.querySelectorAll('.ss .scene')].filter(x => !x.getAttribute('aria-label')).map(x => x.id),
          marks: [...document.querySelectorAll('.ss svg.ti')].filter(v => !(v.getAttribute('aria-hidden') === 'true' || (v.getAttribute('role') === 'img' && v.getAttribute('aria-label') && (v.querySelector('title') || {}).textContent === v.getAttribute('aria-label')))).length,
          links: [...document.querySelectorAll('.ss a')].filter(a => !named(a)).map(a => a.getAttribute('href')),
          buttons: [...document.querySelectorAll('.ss button')].filter(b => !named(b)).map(b => b.className),
          regions: [...document.querySelectorAll('.ss .issue-body')].filter(b => !(b.getAttribute('role') === 'region' && b.tabIndex === 0 && document.getElementById(b.getAttribute('aria-labelledby')))).length,
          dialog: (d => d.getAttribute('role') === 'dialog' && d.getAttribute('aria-modal') === 'true' && d.getAttribute('aria-labelledby') === 'detail-title')(document.getElementById('detail')),
          live: (l => l && l.getAttribute('aria-live') === 'polite')(document.getElementById('orbit-announce')),
        };
      })()`)
      const namesOk = !names.scenes.length && !names.marks && !names.links.length && !names.buttons.length && !names.regions && names.dialog && names.live
      row('a11y: names, regions, dialog', namesOk, `unlabelled scenes ${names.scenes.join(' ') || 'none'}, unnamed marks ${names.marks}, links ${names.links.join(' ') || 'none'}, buttons ${names.buttons.join(' ') || 'none'}, unlabelled letter regions ${names.regions}, dialog modal ${names.dialog}, live region ${names.live}`)

      // Tab order at three holds: focus never lands in an inert or unseen element, and reaches the station's own controls
      const tabBad = [], reached = []
      for (const hold of [LEGEND.indexOf('Projects'), NEWS, LEGEND.indexOf('Contact')]) {
        await s.goto(hold); await sleep(300)
        await s.evaluate('document.activeElement && document.activeElement.blur && document.activeElement.blur()')
        let inStation = 0
        for (let i = 0; i < 40; i++) {
          await s.key('Tab', 9, 40)
          const f = await s.evaluate(FOCUS)
          if (f.none) continue
          if (f.inert || !f.seen || (f.pin >= 0 && f.pin !== hold) || f.detail) tabBad.push(`hold ${hold}, Tab ${i + 1}: ${f.what} (pin ${f.pin}, inert ${f.inert}, seen ${f.seen})`)
          if (f.pin === hold) inStation++
        }
        reached.push(`${LEGEND[hold]} ${inStation}`)
        if (!inStation) tabBad.push(`hold ${hold}: Tab never reached the station`)
      }
      row('a11y: Tab never lands in an inert or unseen element', !tabBad.length, `${tabBad.slice(0, 4).join('; ') || 'clean'}; Tab stops in the station: ${reached.join(', ')}`)

      // a dive from a real click and from Enter: focus to Back, the scenes inert, Tab kept out of them, Escape returns focus to the card
      const diveBad = []
      for (const how of ['click', 'Enter']) {
        await s.openEngine(page)
        await s.evaluate(at(LEGEND.indexOf('Tools and games'))); await sleep(1400)
        const cardSel = '.ss #tools a[data-set="tools"][data-k="3"]'
        if (how === 'click') await s.click(cardSel)
        else { await s.evaluate(`document.querySelector('${cardSel}').focus()`); await s.key('Enter', 13, 0) }
        const opened = await until(() => s.evaluate('__ss.diveState.open'), 4000, 50)
        await sleep(200)
        const st = await s.evaluate(`({ focus: document.activeElement.id, inert: document.getElementById('scenes').inert, title: document.getElementById('detail-title').textContent })`)
        const out = []
        for (let i = 0; i < 8; i++) { await s.key('Tab', 9, 40); const f = await s.evaluate(FOCUS); if (!f.none && (f.inert || f.pin >= 0)) out.push(f.what) }
        await s.key('Escape', 27, 0)
        const closed = await until(() => s.evaluate('!__ss.diveState.active'), 3000, 50)
        await sleep(200)
        const back = await s.evaluate(`({ card: document.activeElement === document.querySelector('${cardSel}'), what: document.activeElement.tagName + '.' + document.activeElement.className, inert: document.getElementById('scenes').inert })`)
        if (!(opened && st.focus === 'detail-back' && st.inert && !out.length && closed && back.card && !back.inert)) diveBad.push(`${how}: ${JSON.stringify({ opened, ...st, tabIntoScenes: out.join(' '), closed, ...back })}`)
      }
      row('a11y: dive focus (click and Enter)', !diveBad.length, diveBad.join('; ') || 'focus to Back, scenes inert, Tab stays out, Escape returns focus to the card')
    })

    // ---------------------------------------------------------------- every card fits
    await group('fit', async () => {
      const SETS = [['tools', '#tools .ring'], ['newsletter', '#newsletter .pieces'], ['changelog', '#changelog .pieces']]
      for (const [w, h] of SIZES) {
        const bad = [], spans = []
        for (const [id, sel] of SETS) {
          await s.openEngine(join(`p=${SCENE_IDS.indexOf(id)}`), w, h); await sleep(200)
          const fit = await s.evaluate(FIT(sel))
          spans.push(`${id} ${fit.shown}`)
          if (!fit.inside || fit.overlaps || fit.overflowX) bad.push(`${id}: ${JSON.stringify(fit)}`)
        }
        await s.openEngine(join('p=5'),w,h)
        const c=await s.evaluate(`(() => {const b=e=>e.getBoundingClientRect(),a=document.getElementById('creative-stories'),m=document.getElementById('creative-music'),hud=b(document.querySelector('.hud-nav')), items=[...a.querySelectorAll('.story-index,.story-panel,.creative-controls')], pass=items.every(e=>{const r=b(e),w=b(a);return r.left>=w.left-1&&r.right<=w.right+1&&r.top>=w.top-1&&r.bottom<=w.bottom+1})&&b(a).bottom<hud.top; return {pass,stories:a.querySelectorAll('.story-choice').length,records:m.querySelectorAll('.record-leaf').length,overlap:!m.hidden&&b(a).right>=b(m).left,overflow:document.documentElement.scrollWidth>innerWidth}})()`)
        spans.push(`creative ${c.stories}/${c.records}`)
        if (!c.pass||c.stories!==17||c.records!==9||c.overlap||c.overflow) bad.push(`creative: ${JSON.stringify(c)}`)
        row(`cards fit (${w}x${h})`, !bad.length, bad.join('; ').slice(0, 400) || spans.join(', '))
      }
      await s.viewport(1440, 900)
    })

    // ---------------------------------------------------------------- teardown
    // leave for home and come back three times. Listeners on window and document
    // return to home's count, the debug hook and the html classes go, dispose
    // reports loseContext, and the heap after GC holds within 10%.
    await group('teardown', async () => {
      consoleScope = 'home'
      await s.viewport(1440, 900)
      await s.open(`${origin}/`)
      await sleep(1500)
      consoleScope = 'scroll'
      const baseline = { window: await s.listeners('window'), document: await s.listeners('document') }
      const cycles = []
      const disposed0 = s.disposals.length
      for (let cycle = 1; cycle <= 3; cycle++) {
        await s.evaluate(`window.___navigate(${JSON.stringify(new URL(page).pathname + new URL(page).search)})`)
        const mounted = await s.running()
        // on the route the counter must see the engine's own listeners, or the comparison proves nothing
        const mountedWindow = await s.listeners('window')
        await s.evaluate(`window.___navigate('/')`)
        const left = await until(() => s.evaluate(`location.pathname === '/' && !document.documentElement.classList.contains('ss-on') && window.__ss === undefined`))
        await sleep(1500)
        const state = await s.evaluate(`({ ss: typeof window.__ss, classes: ['ss-on', 'locked', 'calm'].filter(c => document.documentElement.classList.contains(c)), dir: document.documentElement.hasAttribute('data-dir'), vh: document.documentElement.style.getPropertyValue('--vh'), tags: document.querySelectorAll('.moon-tag').length })`)
        cycles.push({ cycle, mounted, mountedWindow, left, ...state, window: await s.listeners('window'), document: await s.listeners('document'), heap: await s.heap(), disposed: s.disposals.length - disposed0, loseContext: s.disposals.at(-1) === true })
      }
      const heapOk = cycles.every(c => c.heap <= cycles[0].heap * 1.1)
      const teardownOk = cycles.every(c => c.mounted && c.mountedWindow > baseline.window && c.left && c.ss === 'undefined' && !c.classes.length && !c.dir && !c.vh && !c.tags && c.window === baseline.window && c.document === baseline.document && c.disposed === c.cycle && c.loseContext) && heapOk
      const mb = n => (n / 1048576).toFixed(1)
      row('teardown and remount', teardownOk, `home listeners window ${baseline.window}, document ${baseline.document}; ` + cycles.map(c => `cycle ${c.cycle}: mounted ${c.mounted} (window ${c.mountedWindow}), left: window ${c.window}, document ${c.document}, __ss ${c.ss}, html ${c.classes.join(' ') || 'clean'}, disposed ${c.disposed} (loseContext ${c.loseContext}), heap ${mb(c.heap)} MB`).join('; '))
    })

    await session.close(); session = null
    row('console clean', consoleLog.length === 0, consoleLog.join(' | ').slice(0, 600) || 'no errors or warnings on /scroll/ or across the teardown cycles')
    if (siteLog.length) console.log(`NOTE other pages' messages (the site's, not this route's): ${[...new Set(siteLog.map(t => t.split('\n')[0].replace(/; visit .*/, '')))].join(' | ')}`)
  }
} catch (error) {
  row('harness', false, error.message)
} finally {
  if (session) try { await session.close() } catch { /* teardown */ }
  if (chrome) { chrome.kill('SIGKILL'); await new Promise(resolve => chrome.once('exit', resolve)) }
  if (profile) try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) } catch { /* temporary profile */ }
  console.log(`PENDING: ${pendingEngine.join(', ')}`)
  console.log(`CHECKS: ${rows.filter(r => r.pass).length} passed, ${rows.filter(r => !r.pass).length} failed`)
  if (rows.some(r => !r.pass)) process.exitCode = 1
}
