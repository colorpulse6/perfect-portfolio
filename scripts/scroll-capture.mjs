#!/usr/bin/env node
// Production shell checks over the Chrome DevTools Protocol.
// Engine-dependent rows stay pending until the next milestone.
import { spawn } from 'node:child_process'
import { accessSync, constants, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const argv = process.argv.slice(2)
const page = (argv.find(a => a.startsWith('--url=')) || '--url=http://127.0.0.1:9123/scroll/?ss-debug').slice(6)
const chromeBin = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const pendingEngine = ['teardown and remount', 'fps', 'position and legend navigation', 'ghost sweep and pixel safeguard', 'dives', 'orbit and reader', 'reduced motion', 'Canvas2D fallback', '390px layout', 'context loss', 'a11y focus']
const rows = []
const row = (name, pass, detail = '') => { rows.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`) }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
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
    async function tab() {
      const info = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
      const ws = new WebSocket(info.webSocketDebuggerUrl)
      await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
      let nextId = 0
      const waiting = new Map()
      const errors = []
      ws.onmessage = event => {
        const message = JSON.parse(event.data)
        if (message.id && waiting.has(message.id)) {
          const { resolve, reject } = waiting.get(message.id); waiting.delete(message.id)
          message.error ? reject(new Error(message.error.message)) : resolve(message.result)
        } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
        else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value ?? a.description).join(' '))
        else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error' && message.params.entry.source !== 'network') errors.push(message.params.entry.text)
      }
      const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; waiting.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) })
      await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable')
      const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value
      const open = async (url, noJs = false) => {
        await send('Emulation.setScriptExecutionDisabled', { value: noJs })
        await send('Page.navigate', { url })
        for (let i = 0; i < 100; i++) { if (await evaluate('document.readyState === "complete"')) return; await sleep(100) }
        throw new Error(`page did not load: ${url}`)
      }
      const close = async () => { ws.close(); await fetch(`http://127.0.0.1:${port}/json/close/${info.id}`) }
      return { evaluate, open, close, errors }
    }
    session = await tab()
    await session.open(page)
    const head = await session.evaluate(`({title:document.title,canonical:document.querySelector('link[rel="canonical"]')?.href,robots:document.querySelector('meta[name="robots"]')?.content})`)
    row('SEO head', head.title === 'scroll | Nichalas Barnes' && head.canonical === 'https://nichalasbarnes.com/scroll/' && /noindex/.test(head.robots ?? ''), JSON.stringify(head))
    const shell = await session.evaluate(`({scenes:document.querySelectorAll('.ss .scene').length,links:document.querySelectorAll('.ss .hud-nav a').length,projects:document.querySelectorAll('.ss #projects .ring li').length,tools:document.querySelectorAll('.ss #tools .ring li').length,letters:document.querySelectorAll('.ss .issue').length})`)
    row('SSR shell', shell.scenes === 11 && shell.links === 11 && shell.projects === 7 && shell.tools === 5 && shell.letters > 0, JSON.stringify(shell))
    row('console clean', session.errors.length === 0, session.errors.join(' | '))
    await session.close(); session = await tab()
    await session.open(page, true)
    const fallback = await session.evaluate(`({scenes:document.querySelectorAll('.ss .scene').length,visible:getComputedStyle(document.querySelector('.ss .pin')).visibility,position:getComputedStyle(document.querySelector('.ss .pin')).position,story:!!document.querySelector('a[href^="/writing/#"]'),newsletter:!!document.querySelector('.issue-body p')})`)
    row('no-JS fallback', fallback.scenes === 11 && fallback.visible === 'visible' && fallback.position !== 'fixed' && fallback.story && fallback.newsletter, JSON.stringify(fallback))
    await session.close(); session = null
  }
} catch (error) {
  row('harness', false, error.message)
} finally {
  if (session) try { await session.close() } catch { /* teardown */ }
  if (chrome) { chrome.kill('SIGKILL'); await new Promise(resolve => chrome.once('exit', resolve)) }
  if (profile) try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) } catch { /* temporary profile */ }
  console.log(`PENDING ENGINE: ${pendingEngine.join(', ')}`)
  console.log(`SHELL CHECKS: ${rows.filter(r => r.pass).length} passed, ${rows.filter(r => !r.pass).length} failed`)
  if (rows.some(r => !r.pass)) process.exitCode = 1
}
