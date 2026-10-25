import type { Track } from "./queue"

export interface PlayState { playing: boolean; position: number; duration: number }
/** What the queue needs from a platform's embedded player. */
export interface Adapter {
  play(track: Track): Promise<void>
  resume(): void
  pause(): void
  onEnded(cb: () => void): void
  onState(cb: (state: PlayState) => void): void
  onError(cb: () => void): void
}
/** The Spotify embed refuses to autoplay until the listener has pressed play inside it once. */
export interface SpotifyAdapter extends Adapter {
  /** Show a track in the embed without playing it. */
  prepare(track: Track): Promise<void>
  seek(seconds: number): void
  /** The listener pressed play inside the embed. */
  onStarted(cb: () => void): void
}

const scripts = new Map<string, Promise<void>>()
function loadScript(src: string): Promise<void> {
  if (!scripts.has(src)) scripts.set(src, new Promise((resolve, reject) => {
    const el = document.createElement("script")
    el.src = src; el.async = true
    el.onload = () => resolve(); el.onerror = () => reject(new Error(`could not load ${src}`))
    document.head.appendChild(el)
  }))
  return scripts.get(src)!
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createSoundCloudAdapter(host: HTMLElement): Adapter {
  let widget: any = null
  let ended: () => void = () => {}, state: (s: PlayState) => void = () => {}, error: () => void = () => {}
  let duration = 0
  async function start(track: Track) {
    await loadScript("https://w.soundcloud.com/player/api.js")
    const SC = (window as any).SC
    if (!widget) {
      const frame = document.createElement("iframe")
      frame.title = "SoundCloud player"; frame.allow = "autoplay"; frame.width = "300"; frame.height = "166"
      frame.src = `https://w.soundcloud.com/player/?auto_play=false&url=${encodeURIComponent(track.ref)}`
      host.appendChild(frame)
      widget = SC.Widget(frame)
      widget.bind(SC.Widget.Events.PLAY, () => { widget.getDuration((d: number) => { duration = d }); state({ playing: true, position: 0, duration }) })
      widget.bind(SC.Widget.Events.PAUSE, () => state({ playing: false, position: 0, duration }))
      widget.bind(SC.Widget.Events.PLAY_PROGRESS, (e: { currentPosition: number }) => state({ playing: true, position: e.currentPosition, duration }))
      widget.bind(SC.Widget.Events.FINISH, () => ended())
      widget.bind(SC.Widget.Events.ERROR, () => error())
      await new Promise<void>(resolve => widget.bind(SC.Widget.Events.READY, () => resolve()))
      widget.play()
    } else {
      duration = 0
      widget.load(track.ref, { auto_play: true, show_artwork: false, show_comments: false, visual: false })
    }
  }
  return {
    play: track => start(track),
    resume: () => widget?.play(),
    pause: () => widget?.pause(),
    onEnded: cb => { ended = cb }, onState: cb => { state = cb }, onError: cb => { error = cb },
  }
}

export function createSpotifyAdapter(host: HTMLElement): SpotifyAdapter {
  let controller: any = null
  let ended: () => void = () => {}, state: (s: PlayState) => void = () => {}, error: () => void = () => {}, started: () => void = () => {}
  let furthest = 0, finished = false, expected = "", live = false
  const debug = (...a: unknown[]) => (window as unknown as { __musicLog?: unknown[] }).__musicLog?.push([Math.round(performance.now()), ...a].join(" "))
  function update(data: { isPaused: boolean; isBuffering: boolean; duration: number; position: number; playingURI?: string }) {
    debug("upd", data.isPaused ? "paused" : "play", data.position, "/", data.duration, (data.playingURI || "").slice(-6), "exp", expected.slice(-6), "fin", finished)
    // the embed keeps reporting the track it just left until the new one loads: those events are not the new track's
    if (expected && data.playingURI && data.playingURI !== expected) return
    live = !data.isPaused && !data.isBuffering
    // the embed has no "finished" event: the position reaches the end, then the embed pauses or rewinds
    if (data.duration > 0) {
      furthest = Math.max(furthest, data.position)
      const atEnd = data.position >= data.duration - 400 || (data.isPaused && data.position === 0 && furthest >= data.duration - 2500)
      if (atEnd && !finished) { finished = true; ended(); return }
    }
    if (!finished) state({ playing: !data.isPaused, position: data.position, duration: data.duration })
  }
  async function create(track: Track) {
    const api: any = await new Promise((resolve, reject) => {
      (window as any).onSpotifyIframeApiReady = resolve
      loadScript("https://open.spotify.com/embed/iframe-api/v1").catch(reject)
    })
    const slot = document.createElement("div"); host.appendChild(slot)
    controller = await new Promise(resolve => api.createController(slot, { uri: track.ref, width: 300, height: 152 }, resolve))
    controller.addListener("playback_update", (e: { data: any }) => update(e.data))
    controller.addListener("playback_started", () => { furthest = 0; finished = false; started() })
    await new Promise<void>(resolve => controller.addListener("ready", () => resolve()))
  }
  async function start(track: Track) {
    furthest = 0; finished = false; expected = track.ref; live = false
    debug("start", track.ref.slice(-6), controller ? "loadUri" : "create")
    if (!controller) { await create(track); controller.play() }
    else { controller.loadUri(track.ref); controller.play() }
    // loadUri can swallow the first play; ask again while nothing is playing
    for (const wait of [1200, 2600]) setTimeout(() => { if (expected === track.ref && !live && !finished) controller.play() }, wait)
  }
  async function prepare(track: Track) {
    expected = track.ref
    if (!controller) await create(track)
    else controller.loadUri(track.ref)
  }
  return {
    play: track => start(track),
    resume: () => controller?.resume?.() ?? controller?.togglePlay?.(),
    pause: () => controller?.pause?.(),
    prepare,
    seek: seconds => controller?.seek?.(seconds),
    onStarted: cb => { started = cb },
    onEnded: cb => { ended = cb }, onState: cb => { state = cb }, onError: cb => { error = cb },
  }
}
