/**
 * The site's one music player. It lives outside React so it survives route changes:
 * the layout mounts the control bar, this module owns the queue and the embedded players.
 * Everything here runs in the browser only, and only after the first Play click.
 *
 * SoundCloud plays on its own after one click on the site. The Spotify embed refuses to
 * autoplay until the listener presses play inside it once, so its tracks join the queue
 * only after that one press (see enableSpotify).
 */
import { useSyncExternalStore } from "react"
import { createQueue, type Platform, type Track } from "./queue"
import { SOUNDCLOUD_TRACKS, SPOTIFY_TRACKS, TRACKS } from "./tracks"
import { createSoundCloudAdapter, createSpotifyAdapter, type Adapter, type SpotifyAdapter } from "./adapters"

export interface PlayerState {
  open: boolean
  playing: boolean
  loading: boolean
  track: Track | null
  position: number
  duration: number
  shuffle: boolean
  notice: string
  /** off: SoundCloud only. unlocking: waiting for one press inside the Spotify embed. on: Spotify tracks are in the queue. */
  spotify: "off" | "unlocking" | "on"
}

const LOAD_TIMEOUT_MS = 12000
const MAX_FAILURES = 3
const SPOTIFY_END_GAP_MS = 2000

let state: PlayerState = { open: false, playing: false, loading: false, track: null, position: 0, duration: 0, shuffle: true, notice: "", spotify: "off" }
const listeners = new Set<() => void>()
function set(patch: Partial<PlayerState>) { state = { ...state, ...patch }; listeners.forEach(fn => fn()) }
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
export const getState = () => state
const serverState: PlayerState = state
export const usePlayer = () => useSyncExternalStore(subscribe, getState, () => serverState)

let queue: ReturnType<typeof createQueue> | null = null
let adapters: { soundcloud: Adapter; spotify: SpotifyAdapter } | null = null
let spotifyHost: HTMLElement | null = null
let active: Platform | null = null
let failures = 0
let loadTimer: ReturnType<typeof setTimeout> | undefined

function makeHost(className: string) {
  const host = document.createElement("div")
  host.className = className; host.setAttribute("aria-hidden", "true")
  document.body.appendChild(host)
  return host
}

function boot() {
  if (queue && adapters) return { queue, adapters }
  queue = createQueue(SOUNDCLOUD_TRACKS, { shuffle: state.shuffle })
  spotifyHost = makeHost("music-host music-host-spotify")
  adapters = { soundcloud: createSoundCloudAdapter(makeHost("music-host")), spotify: createSpotifyAdapter(spotifyHost) }
  for (const platform of ["soundcloud", "spotify"] as const) {
    const adapter = adapters[platform]
    adapter.onState(s => {
      if (active !== platform) return
      if (s.playing) { clearTimeout(loadTimer); failures = 0; set({ playing: true, loading: false, notice: "", position: s.position, duration: s.duration || state.duration }) }
      else set({ playing: false, position: s.position || state.position })
    })
    // the Spotify embed drops a track change asked for in its last moment: leave it a beat to finish
    adapter.onEnded(() => { setTimeout(() => { if (active === platform) next() }, platform === "spotify" ? SPOTIFY_END_GAP_MS : 0) })
    adapter.onError(() => { if (active === platform) fail() })
  }
  adapters.spotify.onStarted(() => { if (state.spotify === "unlocking") finishUnlock() })
  if ("mediaSession" in navigator) {
    const session = navigator.mediaSession
    session.setActionHandler("play", () => toggle())
    session.setActionHandler("pause", () => toggle())
    session.setActionHandler("nexttrack", () => next())
    session.setActionHandler("previoustrack", () => prev())
  }
  return { queue, adapters }
}

function fail() {
  clearTimeout(loadTimer)
  failures++
  if (failures >= MAX_FAILURES) { set({ playing: false, loading: false, notice: "Playback was blocked. Press play to try again." }); return }
  next()
}

async function playCurrent() {
  const { queue, adapters } = boot()
  const track = queue.current
  if (!track) return
  if (active && active !== track.platform) adapters[active].pause()
  active = track.platform
  set({ open: true, loading: true, playing: false, track, position: 0, duration: 0, notice: "" })
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: "Nic Barnes" })
  clearTimeout(loadTimer)
  loadTimer = setTimeout(fail, LOAD_TIMEOUT_MS)
  try { await adapters[track.platform].play(track) } catch { fail() }
}

export function start(options: { shuffle?: boolean; trackId?: string } = {}) {
  const { queue } = boot()
  if (options.shuffle !== undefined) { queue.setShuffle(options.shuffle); set({ shuffle: options.shuffle }) }
  failures = 0
  queue.start(options.trackId)
  return playCurrent()
}
export function next() { const { queue } = boot(); queue.next(); return playCurrent() }
export function prev() { const { queue } = boot(); queue.prev(); return playCurrent() }
export function toggle() {
  if (!adapters || !active || !state.track) return start()
  if (state.playing) adapters[active].pause()
  else { failures = 0; set({ loading: true }); adapters[active].resume() }
}
export function setShuffle(on: boolean) { boot().queue.setShuffle(on); set({ shuffle: on }) }
export function close() {
  clearTimeout(loadTimer)
  if (adapters && active) adapters[active].pause()
  active = null
  spotifyHost?.classList.remove("music-host-open")
  set({ open: false, playing: false, loading: false, notice: "", spotify: state.spotify === "unlocking" ? "off" : state.spotify })
}

/** Show the Spotify embed and wait for the listener to press play in it once. */
export async function enableSpotify() {
  const { adapters } = boot()
  if (state.spotify !== "off") return
  set({ open: true, spotify: "unlocking", notice: "" })
  spotifyHost!.classList.add("music-host-open")
  if (!state.track) set({ track: SOUNDCLOUD_TRACKS[0], playing: false, loading: false })
  try { await adapters.spotify.prepare(SPOTIFY_TRACKS[0]) } catch { cancelSpotify("The Spotify player could not load.") }
}
export function cancelSpotify(notice = "") {
  spotifyHost?.classList.remove("music-host-open")
  set({ spotify: "off", notice })
}
function finishUnlock() {
  const { queue, adapters } = boot()
  spotifyHost?.classList.remove("music-host-open")
  if (active && active !== "spotify") adapters[active].pause()
  active = "spotify"
  failures = 0
  queue.setTracks(TRACKS)
  queue.start(SPOTIFY_TRACKS[0].id)
  clearTimeout(loadTimer)
  set({ spotify: "on", open: true, track: SPOTIFY_TRACKS[0], playing: true, loading: false, position: 0, duration: 0, notice: "" })
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: SPOTIFY_TRACKS[0].title, artist: SPOTIFY_TRACKS[0].artist, album: "Nic Barnes" })
}
/** For checks: jump the Spotify embed to a position so a preview can be run out quickly. */
export function seekSpotify(seconds: number) { adapters?.spotify.seek(seconds) }
