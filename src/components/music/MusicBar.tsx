import React, { useEffect } from "react"
import { useAmbientAudio } from "../audio/AmbientAudioProvider"
import { cancelSpotify, close, enableSpotify, getState, seekSpotify, next, prev, setShuffle, start, toggle, usePlayer } from "./player"
import { PlatformIcon } from "./PlatformIcon"
import "./music.css"

const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` }

/** The site's control surface for the music queue. Mounted by the layout, so it stays across routes. */
const MusicBar: React.FC = () => {
  const player = usePlayer()
  const ambient = useAmbientAudio()
  // `?music-debug` hands the player to the harness
  useEffect(() => { const w = window as unknown as { __music?: unknown }; if (w.__music || /[?&]music-debug/.test(window.location.search)) (window as unknown as { __musicLog: unknown[] }).__musicLog = []; w.__music = { start, next, prev, toggle, setShuffle, close, enableSpotify, seekSpotify, state: getState } }, [])
  // the ambient bed gives way while music plays
  useEffect(() => { if (player.playing && ambient && !ambient.muted) ambient.toggle() }, [player.playing, ambient])
  if (!player.open || !player.track) return null
  const { track } = player
  const percent = player.duration > 0 ? Math.min(100, Math.round(100 * player.position / player.duration)) : 0
  return (
    <section className="music-bar" aria-label="Music player" data-cosmos-avoid="">
      <div className="music-bar-main">
        <button type="button" className="music-btn" onClick={() => prev()} aria-label="Previous track">‹</button>
        <button type="button" className="music-btn music-play" onClick={() => toggle()} aria-label={player.playing ? "Pause" : "Play"}>{player.loading ? "…" : player.playing ? "❚❚" : "▶"}</button>
        <button type="button" className="music-btn" onClick={() => next()} aria-label="Next track">›</button>
        <div className="music-info">
          <span className="music-title" aria-live="polite">{track.title}</span>
          <span className="music-meta"><PlatformIcon platform={track.platform} />{track.artist} · {track.platform === "spotify" ? "Spotify preview" : "SoundCloud"}{player.duration > 0 ? ` · ${clock(player.position)} / ${clock(player.duration)}` : ""}</span>
        </div>
        <button type="button" className="music-btn" onClick={() => close()} aria-label="Close the player">×</button>
      </div>
      <div className="music-extras">
        {player.spotify === "off" && <button type="button" className="music-btn music-spotify" onClick={() => { void enableSpotify() }} title="Add Alex's Hand from Spotify (30 second previews)"><PlatformIcon platform="spotify" />+ Spotify</button>}
        <button type="button" className="music-btn music-shuffle" aria-pressed={player.shuffle} onClick={() => setShuffle(!player.shuffle)} title={player.shuffle ? "Shuffle on" : "Shuffle off"}>Shuffle</button>
      </div>
      <div className="music-progress" role="progressbar" aria-label="Track progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
      {player.spotify === "unlocking" && <p className="music-unlock" role="status">Press play in the Spotify box once to add Alex&apos;s Hand (30 second previews). <button type="button" className="music-link" onClick={() => cancelSpotify()}>Cancel</button></p>}
      {player.notice && <p className="music-notice" role="status">{player.notice}</p>}
    </section>
  )
}
export default MusicBar
