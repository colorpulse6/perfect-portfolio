#!/usr/bin/env node
// Headless capture harness for the cosmos stage (the WebGL Atlas and, from
// milestone 2, the wormhole journey). It drives system Chrome over the
// DevTools protocol, so it needs no puppeteer or other dependency.
//
// Serve the site first, for example:
//   npx gatsby build && npx gatsby serve -p 9123 -H 127.0.0.1
// or use `npx gatsby develop` and pass --url http://127.0.0.1:8000.
import { spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const USAGE = `Usage: node scripts/cosmos-capture.mjs <scenario> [arg] [options]

Scenarios:
  atlas                 Capture the Atlas arrival frame.
  atlas-enter <domain>  Click a galaxy (obsidian, writing, web, ...) and
                        capture the entered view with its project labels.
  closeup               Zoom into the black hole and capture the close-up.
  perf                  Measure the frame rate in the Atlas overview and the
                        close-up (videos are blocked, see below).
  context-loss          Lose and restore the WebGL context on /atlas; check the
                        classic Atlas takes over and the WebGL one returns on
                        the next visit.
  journey [t...]        From home, click the call to action and capture the
                        journey held at each time (default: the storyboard
                        beats), then the Atlas after the hand-off; finally go
                        back and check the home page and particles return.
  longtasks             Report main-thread tasks over 50ms from the click to
                        the settled Atlas.
  audio                 Count Web Audio nodes the journey creates (muted by
                        default; add --unmuted for the score).

Options:
  --url <base>     Site base URL. Default: http://127.0.0.1:9123
  --path <path>    Page path. Default: /atlas/ (cosmos-debug is added).
                   Use "/atlas/?atlas-legacy" for the classic Atlas.
  --size <WxH>     Viewport in CSS pixels. Default: 1440x900
  --dpr <n>        Device pixel ratio. Default: 1
  --out <dir>      Folder for the JPEG captures. Default: cosmos-captures
  --block-video    Block video downloads (perf always does this).
  --unmuted        Start with site sound on (audio scenario).
  --chrome <path>  Chrome binary. Default: $CHROME, else system Chrome.
  --help           Show this text.

Note: headless Chrome lowers the page frame rate to the video frame rate as
soon as two or more videos play (seen on a bare WebGL page too), so frame
rates measured with the project rail videos playing are not meaningful.

Exit code: 0 on success, 1 on a failure or a page exception, 2 on bad usage.`

// ── Arguments ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = {
    url: "http://127.0.0.1:9123",
    path: "/atlas/",
    size: [1440, 900],
    dpr: 1,
    out: "cosmos-captures",
    blockVideo: false,
    chrome: process.env.CHROME || "",
    positional: [],
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => {
      if (i + 1 >= argv.length) fail(`${a} needs a value`)
      return argv[++i]
    }
    if (a === "--help" || a === "-h") opts.help = true
    else if (a === "--url") opts.url = next().replace(/\/$/, "")
    else if (a === "--path") opts.path = next()
    else if (a === "--size") {
      const m = /^(\d+)x(\d+)$/.exec(next())
      if (!m) fail("--size expects WxH, for example 1440x900")
      opts.size = [Number(m[1]), Number(m[2])]
    } else if (a === "--dpr") {
      opts.dpr = Number(next())
      if (!(opts.dpr > 0)) fail("--dpr expects a positive number")
    } else if (a === "--out") opts.out = next()
    else if (a === "--block-video") opts.blockVideo = true
    else if (a === "--unmuted") opts.unmuted = true
    else if (a === "--chrome") opts.chrome = next()
    else if (a.startsWith("--")) fail(`unknown option ${a}`)
    else opts.positional.push(a)
  }
  return opts
}

function fail(message) {
  console.error(`cosmos-capture: ${message}\n\n${USAGE}`)
  process.exit(2)
}

const opts = parseArgs(process.argv.slice(2))
if (opts.help || opts.positional.length === 0) {
  console.log(USAGE)
  process.exit(opts.help ? 0 : 2)
}
const [scenario, ...scenarioArgs] = opts.positional
const SCENARIOS = ["atlas", "atlas-enter", "closeup", "perf", "context-loss", "journey", "longtasks", "audio"]
if (!SCENARIOS.includes(scenario)) fail(`unknown scenario "${scenario}"`)
if (scenario === "atlas-enter" && !scenarioArgs[0]) fail("atlas-enter needs a domain id, for example obsidian")
const fromHome = ["journey", "longtasks", "audio"].includes(scenario)

const [W, H] = opts.size
const legacy = /atlas-legacy/.test(opts.path)
const pagePath = legacy || /cosmos-debug/.test(opts.path) ? opts.path : opts.path + (opts.path.includes("?") ? "&" : "?") + "cosmos-debug"
const tag = `${W}x${H}@${opts.dpr}x${legacy ? "-legacy" : ""}`
fs.mkdirSync(opts.out, { recursive: true })

// ── Chrome and the DevTools protocol ─────────────────────────────────────
function chromeBinary() {
  if (opts.chrome) return opts.chrome
  if (process.platform === "darwin") return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  if (process.platform === "win32") return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  return "google-chrome"
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const port = 9300 + Math.floor(Math.random() * 500)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cosmos-capture-"))
const chrome = spawn(
  chromeBinary(),
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${W},${H}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-gpu",
    "--autoplay-policy=no-user-gesture-required",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "ignore"] }
)
chrome.on("error", (e) => {
  console.error(`cosmos-capture: cannot start Chrome (${e.message}). Pass --chrome or set CHROME.`)
  process.exit(1)
})

async function pageTarget() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const page = list.find((t) => t.type === "page")
      if (page) return page
    } catch {
      // Chrome is still starting.
    }
    await sleep(250)
  }
  throw new Error("Chrome did not open a page target")
}

let ws = null
let msgId = 0
const pending = new Map()
const listeners = new Set()
const problems = []

async function connect() {
  const target = await pageTarget()
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true })
    ws.addEventListener("error", () => reject(new Error("DevTools socket failed")), { once: true })
  })
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`))
      else resolve(msg.result)
      return
    }
    if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails
      problems.push({ kind: "exception", text: d?.exception?.description || d?.text || "unknown exception" })
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      problems.push({ kind: "console.error", text: msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ") })
    }
    listeners.forEach((fn) => fn(msg))
  })
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

function waitEvent(name, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      listeners.delete(fn)
      reject(new Error(`timed out waiting for ${name}`))
    }, timeoutMs)
    const fn = (msg) => {
      if (msg.method !== name) return
      clearTimeout(timer)
      listeners.delete(fn)
      resolve(msg.params)
    }
    listeners.add(fn)
  })
}

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(`page evaluation failed: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`)
  return r.result?.value
}

// ── Page helpers ─────────────────────────────────────────────────────────
async function open(pathAndQuery) {
  const loaded = waitEvent("Page.loadEventFired", 60000)
  await send("Page.navigate", { url: opts.url + pathAndQuery })
  await loaded
}

async function capture(label) {
  const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 85 })
  const file = path.join(opts.out, `${scenario}-${label}-${tag}.jpg`)
  fs.writeFileSync(file, Buffer.from(r.data, "base64"))
  console.log(`capture: ${file}`)
}

async function click(x, y) {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y })
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 })
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 })
}

async function wheel(x, y, deltaY, ticks) {
  for (let i = 0; i < ticks; i++) {
    await send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY })
    await sleep(40)
  }
}

/** requestAnimationFrame rate over `ms`, plus the stage's own frame rate. */
async function frameRate(ms = 2000) {
  return evaluate(`new Promise((resolve) => {
    const f0 = window.__cosmos ? __cosmos.frames : 0
    let n = 0
    const t0 = performance.now()
    const tick = () => {
      n++
      const el = performance.now() - t0
      if (el < ${ms}) requestAnimationFrame(tick)
      else resolve({ raf: Math.round((n * 1000) / el), stage: window.__cosmos ? Math.round(((__cosmos.frames - f0) * 1000) / el) : null })
    }
    requestAnimationFrame(tick)
  })`)
}

/** Waits until the stage renders the Atlas, then lets the intro dolly settle. */
async function waitForAtlas() {
  if (legacy) {
    await sleep(4000)
    return
  }
  const t0 = Date.now()
  for (;;) {
    const s = await evaluate(`window.__cosmos ? { mode: __cosmos.mode, frames: __cosmos.frames } : null`)
    if (s && s.mode === "atlas" && s.frames > 20) break
    if (Date.now() - t0 > 20000) {
      const mode = await evaluate(`document.documentElement.dataset.cosmosMode || "unset"`)
      throw new Error(`the Atlas did not start within 20s (mode: ${mode}); check WebGL2 support and the console`)
    }
    await sleep(200)
  }
  await sleep(2500)
}

async function labelSummary() {
  return evaluate(`(() => {
    const all = [...document.querySelectorAll(".cosmos-lbl")]
    const shown = all.filter((e) => e.style.visibility === "visible")
    return { labels: all.length, visible: shown.length, works: [...document.querySelectorAll(".cosmos-lbl--work")].map((e) => e.firstChild ? e.firstChild.textContent : "") }
  })()`)
}

async function screenOf(kind, id) {
  const p = await evaluate(`window.__cosmos ? __cosmos.screenOf(${JSON.stringify(kind)}, ${JSON.stringify(id)}) : null`)
  if (!p) throw new Error(`${kind} "${id}" is not on screen (unknown id?)`)
  return p
}

async function zoomToCore() {
  const c = await screenOf("core", "core")
  await wheel(c.x, c.y, -120, 10)
  await sleep(2500)
}

/** Waits on home until the stage has compiled and built its resources. */
async function waitForWarmStage() {
  const t0 = Date.now()
  for (;;) {
    if (await evaluate(`!!(window.__cosmos && __cosmos.warm)`)) break
    if (Date.now() - t0 > 20000) throw new Error("the stage did not warm up on home within 20s")
    await sleep(200)
  }
  await sleep(800)
}

/** Hovers and clicks the call to action; resolves when the journey runs. */
async function launchJourney() {
  const cta = await evaluate(`(() => { const r = document.querySelector(".atlas-enter")?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null })()`)
  if (!cta) throw new Error("no call to action (.atlas-enter) on the home page")
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: cta.x, y: cta.y })
  await sleep(500)
  const clickAt = await evaluate(`performance.now()`)
  await click(cta.x, cta.y)
  const t0 = Date.now()
  while ((await evaluate(`__cosmos.mode`)) !== "journey") {
    if (Date.now() - t0 > 5000) throw new Error("the journey did not start within 5s of the click")
    await sleep(5)
  }
  return clickAt
}

async function waitForAtlasRoute(timeoutMs = 10000) {
  const t0 = Date.now()
  while ((await evaluate(`__cosmos.mode + " " + location.pathname`)) !== "atlas /atlas/") {
    if (Date.now() - t0 > timeoutMs) throw new Error("the hand-off to /atlas did not happen")
    await sleep(50)
  }
}

// ── Scenarios ────────────────────────────────────────────────────────────
async function run() {
  await connect()
  await send("Page.enable")
  await send("Runtime.enable")
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: opts.dpr, mobile: W < 700 })
  if (opts.blockVideo || scenario === "perf") {
    await send("Network.enable")
    await send("Network.setBlockedURLs", { urls: ["*.mp4", "*.webm", "*.mov", "*.m4v"] })
  }
  const renderer = await evaluate(`(() => {
    const gl = document.createElement("canvas").getContext("webgl2")
    if (!gl) return "no WebGL2"
    const info = gl.getExtension("WEBGL_debug_renderer_info")
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "WebGL2"
  })()`)
  console.log(`renderer: ${renderer}`)

  if (fromHome) {
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `(() => {
        ${opts.unmuted ? 'localStorage.setItem("audio-muted", "false")' : 'localStorage.removeItem("audio-muted")'}
        window.__longTasks = []
        try {
          new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__longTasks.push([Math.round(e.startTime), Math.round(e.duration)])))
            .observe({ type: "longtask", buffered: true })
        } catch (e) {}
        window.__audioNodes = {}
        const P = window.BaseAudioContext && BaseAudioContext.prototype
        if (P) for (const name of Object.getOwnPropertyNames(P)) {
          if (!name.startsWith("create") || typeof P[name] !== "function") continue
          const o = P[name]
          P[name] = function (...a) { window.__audioNodes[name] = (window.__audioNodes[name] || 0) + 1; return o.apply(this, a) }
        }
      })()`,
    })
    console.log(`page: ${opts.url}/?cosmos-debug at ${tag}`)
    await open("/?cosmos-debug")
    await waitForWarmStage()
  } else {
    console.log(`page: ${opts.url}${pagePath} at ${tag}`)
    await open(pagePath)
    await waitForAtlas()
  }

  if (scenario === "atlas") {
    await capture("arrival")
    if (!legacy) console.log("labels:", JSON.stringify(await labelSummary()))
  } else if (scenario === "atlas-enter") {
    if (legacy) throw new Error("atlas-enter drives the WebGL Atlas; drop atlas-legacy from --path")
    const id = scenarioArgs[0]
    const g = await screenOf("domain", id)
    await click(g.x, g.y)
    await sleep(2400)
    await capture(id)
    console.log("labels:", JSON.stringify(await labelSummary()))
  } else if (scenario === "closeup") {
    if (legacy) throw new Error("closeup drives the WebGL Atlas; drop atlas-legacy from --path")
    await zoomToCore()
    await capture("gargantua")
  } else if (scenario === "perf") {
    if (legacy) throw new Error("perf measures the WebGL Atlas; drop atlas-legacy from --path")
    const overview = await frameRate(2000)
    await zoomToCore()
    const closeEarly = await frameRate(1500)
    await sleep(3000)
    const closeLate = await frameRate(2000)
    const scale = await evaluate(`__cosmos.atlasScale`)
    console.log("perf (rAF fps / stage fps):")
    console.log(`  overview          ${overview.raf} / ${overview.stage}`)
    console.log(`  close-up          ${closeEarly.raf} / ${closeEarly.stage}`)
    console.log(`  close-up adapted  ${closeLate.raf} / ${closeLate.stage}  (resolution scale ${scale.toFixed(2)})`)
  } else if (scenario === "journey") {
    const times = scenarioArgs.length ? scenarioArgs.map(Number) : [0, 0.3, 1.0, 1.6, 2.05, 2.25, 2.5, 3.8]
    await launchJourney()
    for (const t of times) {
      await evaluate(`__cosmos.goto(${t})`)
      await sleep(350)
      await capture(`t${t.toFixed(2)}`)
      if (t >= 3.2) break
    }
    await evaluate(`__cosmos.goto(null)`)
    await waitForAtlasRoute()
    await sleep(1400)
    await capture("atlas")
    const hud = await evaluate(`({ page: getComputedStyle(document.querySelector(".atlas-page")).opacity, labels: document.querySelectorAll(".cosmos-lbl").length })`)
    console.log(`${hud.page === "1" && hud.labels > 0 ? "PASS" : "FAIL"}  the Atlas HUD and labels show after the hand-off (${JSON.stringify(hud)})`)
    await evaluate(`history.back()`)
    await sleep(3500)
    const home = await evaluate(`({
      path: location.pathname,
      mode: __cosmos.mode,
      title: getComputedStyle(document.querySelector(".hometex") || document.body).opacity,
      particles: [...document.querySelectorAll("canvas")].some((c) => !c.classList.contains("cosmos-stage") && c.width > 0),
    })`)
    await capture("back-home")
    const ok = home.path === "/" && home.mode === "idle" && home.title === "1" && home.particles
    console.log(`${ok ? "PASS" : "FAIL"}  going back restores the home page and particles (${JSON.stringify(home)})`)
    if (!ok || hud.page !== "1") throw new Error("journey checks failed")
  } else if (scenario === "longtasks") {
    const clickAt = await launchJourney()
    await waitForAtlasRoute()
    await sleep(1500)
    const tasks = await evaluate(`window.__longTasks.filter((t) => t[0] >= ${clickAt} - 1)`)
    const marks = await evaluate(`(() => { const o = {}; for (const n of ["cosmos-snapshot", "cosmos-launch"]) { const m = performance.getEntriesByName(n)[0]; if (m) o[n] = Math.round(m.duration) } return o })()`)
    console.log("launch (ms from click):", JSON.stringify(marks))
    console.log(`long tasks after the click [ms after click, duration]: ${JSON.stringify(tasks.map(([s, d]) => [s - Math.round(clickAt), d]))}`)
    const over = tasks.filter(([, d]) => d > 50)
    console.log(`${over.length ? "WARN" : "PASS"}  ${over.length} task(s) over 50ms after the click`)
  } else if (scenario === "audio") {
    await launchJourney()
    await waitForAtlasRoute()
    await sleep(1000)
    const nodes = await evaluate(`window.__audioNodes`)
    console.log(`sound ${opts.unmuted ? "on" : "off"}, Web Audio nodes created: ${JSON.stringify(nodes)}`)
    const osc = nodes.createOscillator || 0
    // The score uses 9 oscillators; a transition whoosh would add more.
    const ok = opts.unmuted ? osc === 9 : osc === 0
    console.log(`${ok ? "PASS" : "FAIL"}  ${opts.unmuted ? "exactly the score graph plays (9 oscillators, no whoosh)" : "a muted journey creates no score nodes"}`)
    if (!ok) throw new Error("audio checks failed")
  } else if (scenario === "context-loss") {
    if (legacy) throw new Error("context-loss drives the WebGL Atlas; drop atlas-legacy from --path")
    const state = () =>
      evaluate(`({
        mode: __cosmos.mode,
        cosmos: !!document.querySelector(".atlas-page--cosmos"),
        classic: !!document.querySelector(".atlas-page:not(.atlas-page--cosmos)"),
        frames: __cosmos.frames,
      })`)
    // Keep the extension from before the loss: a lost context returns null
    // from getExtension.
    const context = (fn) =>
      evaluate(`(() => {
        if (!window.__cosmosLoseExt) {
          const gl = document.querySelector(".cosmos-stage")?.getContext("webgl2")
          window.__cosmosLoseExt = gl && gl.getExtension("WEBGL_lose_context")
        }
        if (!window.__cosmosLoseExt) return false
        window.__cosmosLoseExt.${fn}()
        return true
      })()`)
    const results = []
    const check = (name, ok, detail) => {
      results.push(ok)
      console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  (${JSON.stringify(detail)})`}`)
    }
    let s = await state()
    check("the WebGL Atlas is showing", s.mode === "atlas" && s.cosmos, s)
    if (!(await context("loseContext"))) throw new Error("WEBGL_lose_context is not available")
    await sleep(800)
    s = await state()
    check("a lost context hands over to the classic Atlas", s.mode === "off" && !s.cosmos && s.classic, s)
    if (!(await context("restoreContext"))) throw new Error("could not restore the context")
    await sleep(1200)
    s = await state()
    check("a restored context keeps the classic Atlas for this visit", s.mode === "off" && s.classic, s)
    await evaluate(`window.___navigate("/")`)
    await sleep(3500)
    s = await state()
    check("home warms the stage up again", s.mode === "idle", s)
    await evaluate(`window.___navigate("/atlas/")`)
    await sleep(3500)
    const f0 = (await state()).frames
    await sleep(600)
    s = await state()
    check("the next Atlas visit renders the WebGL Atlas", s.mode === "atlas" && s.cosmos && s.frames > f0, s)
    await capture("recovered")
    if (results.some((ok) => !ok)) throw new Error("context-loss checks failed")
  }
}

// The home page's production build logs these React hydration errors on
// master too (text mismatches, 2026-09-26); they are reported, not failed.
const KNOWN_PROBLEMS = /Minified React error #(418|423|425)\b/
const known = (p) => p.kind === "exception" && KNOWN_PROBLEMS.test(p.text)

let exitCode = 0
try {
  await run()
} catch (e) {
  console.error(`cosmos-capture: ${e.message}`)
  exitCode = 1
} finally {
  if (problems.length) {
    console.log(`page problems (${problems.length}):`)
    problems.slice(0, 20).forEach((p) => console.log(`  ${known(p) ? "known " : ""}${p.kind}: ${p.text.split("\n")[0]}`))
    if (problems.some((p) => p.kind === "exception" && !known(p))) exitCode = 1
  }
  try {
    ws?.close()
  } catch {
    // already closed
  }
  chrome.kill("SIGKILL")
  await sleep(300)
  fs.rmSync(profile, { recursive: true, force: true })
  process.exit(exitCode)
}
