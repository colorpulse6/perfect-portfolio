#!/usr/bin/env node
// Checks for the /scroll/ route over the Chrome DevTools Protocol, against a
// production build (`npx gatsby serve -p 9123 -H 127.0.0.1`). Shell rows read the
// server-rendered page; engine rows drive the running engine through its debug
// hook (?ss-debug exposes window.__ss), ported from the prototype's capture.mjs.
// Rows the prototype has and this script does not run yet are listed as pending.
import { spawn } from 'node:child_process'
import { accessSync, constants, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const argv = process.argv.slice(2)
const page = (argv.find(a => a.startsWith('--url=')) || '--url=http://127.0.0.1:9123/scroll/?ss-debug').slice(6)
const origin = new URL(page).origin
const chromeBin = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const pendingEngine = ['pixel safeguard', 'live ghost sweep', 'dives', 'orbit and reader', 'wheel and touch gestures', 'context loss', 'a11y focus']
// The legend in scroll order, and each scene's stagger group: its class, step and
// item count (prototype index.html, r14). Data-driven groups also match __ss.setSizes.
const LEGEND = ['Intro', 'About', 'Projects', 'Tools and games', 'Writing', 'Essays', 'Newsletter', 'Changelog', 'Work with me', 'Contact', 'Atlas']
const STAGGER = [['about', 'facts', '0.04', 3], ['projects', 'ring', '0.04', 7], ['tools', 'ring', '0.03', 5], ['writing', 'pieces', '0.02', 16], ['essays', 'pieces', '0.03', 2], ['newsletter', 'pieces index', '0.012', null], ['changelog', 'pieces', '0.03', null], ['contact', 'links', '0.03', 4]]
const rows = []
const row = (name, pass, detail = '') => { rows.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`) }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const until = async (check, ms = 10000, step = 100) => { for (let t = 0; t < ms; t += step) { if (await check()) return true; await sleep(step) } return false }
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
    // Console errors and warnings for the whole run, for the last row. Home's own
    // messages are the site's, not this route's, and are noted apart (both are on
    // production too, 2026-10-22): React hydration errors (#418, #423, #425) on its
    // fresh load (the teardown's baseline), and react-three-fiber's THREE.Clock
    // deprecation each time home's particle canvas mounts. This route uses neither.
    const SITE_NOISE = [/THREE\.Clock: This module has been deprecated/]
    const consoleLog = [], siteLog = []
    let consoleScope = 'scroll'
    async function tab() {
      const info = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
      const ws = new WebSocket(info.webSocketDebuggerUrl)
      await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
      let nextId = 0
      const waiting = new Map()
      const errors = []
      const disposals = []
      const note = text => { errors.push(text); (consoleScope === 'scroll' && !SITE_NOISE.some(noise => noise.test(text)) ? consoleLog : siteLog).push(text) }
      ws.onmessage = event => {
        const message = JSON.parse(event.data)
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
      const click = async selector => {
        const box = await evaluate(`(r => r && { x: r.left + r.width / 2, y: r.top + r.height / 2 })(document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect())`)
        if (!box) throw new Error(`nothing to click: ${selector}`)
        for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 })
      }
      // listeners on a global (window or document), counted by CDP, not by the page
      const listeners = async expression => {
        const { result } = await send('Runtime.evaluate', { expression })
        const { listeners: found } = await send('DOMDebugger.getEventListeners', { objectId: result.objectId })
        await send('Runtime.releaseObject', { objectId: result.objectId })
        return found.length
      }
      const heap = async () => { await send('HeapProfiler.collectGarbage'); await send('HeapProfiler.collectGarbage'); return (await send('Runtime.getHeapUsage')).usedSize }
      const close = async () => { ws.close(); await fetch(`http://127.0.0.1:${port}/json/close/${info.id}`) }
      return { evaluate, send, viewport, open, openEngine, running, frames, click, listeners, heap, close, errors, disposals }
    }

    // ---------------------------------------------------------------- shell rows
    session = await tab()
    await session.viewport(1440, 900)
    await session.open(page)
    const head = await session.evaluate(`({title:document.title,canonical:document.querySelector('link[rel="canonical"]')?.href,robots:document.querySelector('meta[name="robots"]')?.content})`)
    row('SEO head', head.title === 'scroll | Nichalas Barnes' && head.canonical === 'https://nichalasbarnes.com/scroll/' && /noindex/.test(head.robots ?? ''), JSON.stringify(head))
    const shell = await session.evaluate(`({scenes:document.querySelectorAll('.ss .scene').length,links:document.querySelectorAll('.ss .hud-nav a').length,projects:document.querySelectorAll('.ss #projects .ring li').length,tools:document.querySelectorAll('.ss #tools .ring li').length,letters:document.querySelectorAll('.ss .issue').length})`)
    row('SSR shell', shell.scenes === 11 && shell.links === 11 && shell.projects === 7 && shell.tools === 5 && shell.letters > 0, JSON.stringify(shell))
    await session.close(); session = await tab()
    await session.open(page, true)
    const fallback = await session.evaluate(`({scenes:document.querySelectorAll('.ss .scene').length,visible:getComputedStyle(document.querySelector('.ss .pin')).visibility,position:getComputedStyle(document.querySelector('.ss .pin')).position,story:!!document.querySelector('a[href^="/writing/#"]'),newsletter:!!document.querySelector('.issue-body p')})`)
    row('no-JS fallback', fallback.scenes === 11 && fallback.visible === 'visible' && fallback.position !== 'fixed' && fallback.story && fallback.newsletter, JSON.stringify(fallback))
    await session.close(); session = await tab()
    const s = session

    // ---------------------------------------------------------------- engine rows
    const join = query => page + (page.includes('?') ? '&' : '?') + query
    await s.openEngine(page)
    const version = await s.evaluate(`({ root: document.querySelector('.ss').dataset.ssVersion, script: __ss.version })`)
    row('version', !!version.root && version.root === version.script, JSON.stringify(version))

    const boot = await s.evaluate(`({ renderer: __ss.renderer, tier: __ss.tier, rm: __ss.rm, on: document.documentElement.classList.contains('ss-on') })`)
    row('boot', boot.renderer === 'webgl2' && boot.tier === 'high' && boot.rm === false && boot.on, JSON.stringify(boot))

    const fps = await s.evaluate(`new Promise(done => { const f0 = __ss.frames; setTimeout(() => done(__ss.frames - f0), 1000) })`)
    row('fps', fps >= 55, `${fps} frames in 1 s at 1440x900 (60 wanted)`)

    // the smoothed position at 0, 25, 50, 75 and 100% of the document: 11 scenes, sp 0 to 10
    const spAt = []
    const maxY = await s.evaluate('document.documentElement.scrollHeight - innerHeight')
    for (const f of [0, 0.25, 0.5, 0.75, 1]) { await s.evaluate(`scrollTo(0, ${f} * ${maxY})`); await sleep(900); spAt.push(Number((await s.evaluate('__ss.sp')).toFixed(2))) }
    const spWant = [0, 2.5, 5, 7.5, 10]
    row('position', spAt.every((sp, i) => Math.abs(sp - spWant[i]) <= 0.06), `sp ${spAt.join(' ')} (prototype: 0 2.46 4.96 7.46 9.96)`)

    // the legend: one chip per scene, in scroll order, labelled as the section is; a click travels there
    const legend = await s.evaluate(`({ chips: [...document.querySelectorAll('.ss .hud-nav a')].map(a => a.textContent + ' ' + a.getAttribute('href')), scenes: __ss.scenes.map(x => x.label + ' #' + x.id), sections: [...document.querySelectorAll('.ss .scene')].map(x => x.getAttribute('aria-label') + ' #' + x.id) })`)
    const names = legend.chips.map(c => c.split(' #')[0])
    row('legend = scene list', legend.chips.join('|') === legend.scenes.join('|') && legend.scenes.join('|') === legend.sections.join('|') && names.join('|') === LEGEND.join('|'), names.join(', '))
    await s.evaluate('scrollTo(0, 0)'); await until(async () => await s.evaluate('__ss.sp') < 0.01, 3000)
    const target = LEGEND.indexOf('Newsletter')
    await s.click(`.ss .hud-nav a[href="#newsletter"]`)
    const arrived = await until(async () => Math.abs(await s.evaluate('__ss.sp') - target) < 0.02, 6000)
    const after = await s.evaluate(`({ sp: Number(__ss.sp.toFixed(2)), hash: location.hash })`)
    row('legend click navigates', arrived && after.hash === '', `Newsletter chip: sp ${after.sp} (want ${target}), hash "${after.hash}"`)

    // the DOM contract: each scene's stagger group, its step and its item count
    const groups = await s.evaluate(`({ found: [...document.querySelectorAll('.ss .stagger')].map(g => [g.closest('.scene').id, [...g.classList].filter(c => c !== 'stagger').join(' '), g.dataset.step, g.children.length]), sizes: __ss.setSizes })`)
    const groupsWant = STAGGER.map(([id, cls, step, n]) => [id, cls, step, n ?? groups.sizes[id]])
    const groupsOk = JSON.stringify(groups.found) === JSON.stringify(groupsWant) && ['projects', 'tools', 'writing', 'essays', 'newsletter', 'changelog'].every(id => groups.found.find(g => g[0] === id)?.[3] === groups.sizes[id])
    row('stagger groups', groupsOk, groups.found.map(g => `${g[0]} ${g[2]} x${g[3]}`).join(', '))

    // ghosts: at a hold only that station is on screen, between two holds only those two
    const GHOSTS = `(() => {
      const p = __ss.sp, a = Math.floor(p + 1e-6), b = Math.ceil(p - 1e-6), allowed = new Set([a, b]);
      const pins = [...document.querySelectorAll('.ss .pin')], heads = [...document.querySelectorAll('.ss .scene')].map(x => x.querySelector('h1, h2').textContent.trim());
      const vis = (el) => { if (getComputedStyle(el).visibility === 'hidden') return 0; let o = 1; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none') return 0; o *= parseFloat(cs.opacity); } return o; };
      const on = (r) => r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
      const out = [];
      pins.forEach((pin, i) => {
        if (allowed.has(i)) return;
        for (const el of pin.querySelectorAll('h1, h2, .lead, .bio, .facts li, .ring li, .pieces li, .index li, .reader, .pill, .links li, .orbit-nav, .hint, .atlas-wrap')) {
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
    await s.openEngine(page)
    const ghosts = []; let ghostSamples = 0
    for (let i = 0; i < LEGEND.length; i++) for (const d of [0, -0.4, -0.2, 0.2, 0.4]) {
      const p = i + d; if (p < 0 || p > LEGEND.length - 1) continue
      await s.evaluate(`__ss.goto(${p})`); await s.frames(3); ghostSamples++
      const r = await s.evaluate(GHOSTS)
      if (r.out.length) ghosts.push(`p=${r.p}: ${r.out.join(' ')}`)
    }
    row('ghosts (snap sweep)', ghosts.length === 0, `${ghostSamples} samples; ${ghosts.join('; ').slice(0, 400) || 'none'}`)

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
    const wrong = []
    for (let i = 0; i < LEGEND.length; i++) {
      // a snap, three frames, then up to 1 s: a loaded machine can stall a frame past the prototype's fixed 160 ms
      await s.evaluate(`__ss.goto(${i})`); await s.frames(3)
      let r = await s.evaluate(STATION(i))
      for (let t = 0; !r.ok && t < 1000; t += 100) { await sleep(100); r = await s.evaluate(STATION(i)) }
      if (!r.ok) wrong.push(`${i}: wants "${r.want}", dust "${r.dust}", box ${r.boxOk}, shown "${r.shown}"`)
    }
    row('stations show their own headline', wrong.length === 0, wrong.join('; ') || `${LEGEND.length} stations`)

    // no line of copy shows twice, and the dust draws only the window's headlines
    const NORM = "(s => s.replace(/[^a-z0-9 ]/gi, '').replace(/\\s+/g, ' ').trim().toLowerCase())"
    const lines = await s.evaluate(`[...document.querySelectorAll('.ss .pin h1, .ss .pin h2, .ss .pin .pill')].map(el => ${NORM}(el.textContent))`)
    const dupStatic = lines.filter((l, i) => lines.indexOf(l) !== i)
    const SEEN = `(() => {
      const norm = ${NORM}, vis = (el) => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return false; } return true; };
      const out = [...document.querySelectorAll('.ss .pin h1, .ss .pin h2, .ss .pin .pill')].filter(vis).map((el) => norm(el.textContent));
      if (__ss.dust) out.push(norm(__ss.dust));
      const heads = [...document.querySelectorAll('.ss .scene')].map(x => x.querySelector('h1, h2').textContent.trim());
      const a = Math.floor(__ss.sp), b = Math.min(a + 1, heads.length - 1);
      return { out, owned: __ss.dust === null || __ss.dust === heads[a] || __ss.dust === heads[b], dust: __ss.dust };
    })()`
    const dupLive = [], stray = []
    for (let p = 0; p <= LEGEND.length - 1 + 0.001; p += 0.1) {
      await s.evaluate(`__ss.goto(${p.toFixed(2)})`); await s.frames(3)
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
    await s.viewport(1440, 900)

    // teardown: leave for home and come back three times. Listeners on window and
    // document return to home's count, the debug hook and the html classes go,
    // dispose reports loseContext, and the heap after GC holds within 10%.
    consoleScope = 'site'
    await s.open(`${origin}/`)
    await sleep(1500)
    consoleScope = 'scroll'
    const baseline = { window: await s.listeners('window'), document: await s.listeners('document') }
    const cycles = []
    for (let cycle = 1; cycle <= 3; cycle++) {
      await s.evaluate(`window.___navigate(${JSON.stringify(new URL(page).pathname + new URL(page).search)})`)
      const mounted = await s.running()
      // on the route the counter must see the engine's own listeners, or the comparison proves nothing
      const mountedWindow = await s.listeners('window')
      await s.evaluate(`window.___navigate('/')`)
      const left = await until(() => s.evaluate(`location.pathname === '/' && !document.documentElement.classList.contains('ss-on') && window.__ss === undefined`))
      await sleep(1500)
      const state = await s.evaluate(`({ ss: typeof window.__ss, classes: ['ss-on', 'locked', 'calm'].filter(c => document.documentElement.classList.contains(c)), dir: document.documentElement.hasAttribute('data-dir'), vh: document.documentElement.style.getPropertyValue('--vh'), tags: document.querySelectorAll('.moon-tag').length })`)
      cycles.push({ cycle, mounted, mountedWindow, left, ...state, window: await s.listeners('window'), document: await s.listeners('document'), heap: await s.heap(), disposed: s.disposals.length, loseContext: s.disposals.at(-1) === true })
    }
    const heapOk = cycles.every(c => c.heap <= cycles[0].heap * 1.1)
    const teardownOk = cycles.every(c => c.mounted && c.mountedWindow > baseline.window && c.left && c.ss === 'undefined' && !c.classes.length && !c.dir && !c.vh && !c.tags && c.window === baseline.window && c.document === baseline.document && c.disposed === c.cycle && c.loseContext) && heapOk
    const mb = n => (n / 1048576).toFixed(1)
    row('teardown and remount', teardownOk, `home listeners window ${baseline.window}, document ${baseline.document}; ` + cycles.map(c => `cycle ${c.cycle}: mounted ${c.mounted} (window ${c.mountedWindow}), left: window ${c.window}, document ${c.document}, __ss ${c.ss}, html ${c.classes.join(' ') || 'clean'}, disposed ${c.disposed} (loseContext ${c.loseContext}), heap ${mb(c.heap)} MB`).join('; '))

    await session.close(); session = null
    row('console clean', consoleLog.length === 0, consoleLog.join(' | ').slice(0, 600) || 'no errors or warnings on /scroll/ or across the teardown cycles')
    if (siteLog.length) console.log(`NOTE home's messages (site, not this route): ${siteLog.map(t => t.split('\n')[0].replace(/; visit .*/, '')).join(' | ')}`)
  }
} catch (error) {
  row('harness', false, error.message)
} finally {
  if (session) try { await session.close() } catch { /* teardown */ }
  if (chrome) { chrome.kill('SIGKILL'); await new Promise(resolve => chrome.once('exit', resolve)) }
  if (profile) try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) } catch { /* temporary profile */ }
  console.log(`PENDING ENGINE: ${pendingEngine.join(', ')}`)
  console.log(`CHECKS: ${rows.filter(r => r.pass).length} passed, ${rows.filter(r => !r.pass).length} failed`)
  if (rows.some(r => !r.pass)) process.exitCode = 1
}
