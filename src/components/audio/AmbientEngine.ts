const AMBIENT_SRC = "/audio/ambient-background.mp3"
const FADE_DURATION = 1.5

export class AmbientEngine {
  private ctx: AudioContext | null = null
  private audio: HTMLAudioElement | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private masterGain: GainNode | null = null
  private _muted: boolean = true
  private _initialized: boolean = false

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("audio-muted")
      this._muted = stored === null ? true : stored === "true"
    }
  }

  get muted(): boolean {
    return this._muted
  }

  get initialized(): boolean {
    return this._initialized
  }

  init(): void {
    if (this._initialized || typeof window === "undefined") return
    this._initialized = true

    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this._muted ? 0 : 0.45
    this.masterGain.connect(this.ctx.destination)

    this.audio = new Audio(AMBIENT_SRC)
    this.audio.loop = true
    this.audio.crossOrigin = "anonymous"

    this.sourceNode = this.ctx.createMediaElementSource(this.audio)
    this.sourceNode.connect(this.masterGain)

    this.audio.play().catch(() => {})
  }

  setMuted(muted: boolean): void {
    this._muted = muted
    if (typeof window !== "undefined") {
      localStorage.setItem("audio-muted", String(muted))
    }
    if (!this.ctx || !this.masterGain || !this.audio) return

    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    const now = this.ctx.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
    this.masterGain.gain.linearRampToValueAtTime(
      muted ? 0 : 0.45,
      now + FADE_DURATION
    )

    if (!muted && this.audio.paused) {
      this.audio.play().catch(() => {})
    }
  }

  toggle(): boolean {
    this.setMuted(!this._muted)
    return this._muted
  }

  getContext(): AudioContext | null {
    return this.ctx
  }

  resume(): void {
    if (this.ctx?.state === "suspended") {
      this.ctx.resume()
    }
    if (this.audio?.paused && !this._muted) {
      this.audio.play().catch(() => {})
    }
  }
}
