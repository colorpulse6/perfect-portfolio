export type SoundName =
  | "hover"
  | "click"
  | "glitch"
  | "materialize"
  | "dissolve"
  | "keystroke"
  | "whoosh"

export class InteractionSounds {
  private ctx: AudioContext
  private master: GainNode

  constructor(ctx: AudioContext) {
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0.35
    this.master.connect(ctx.destination)
  }

  play(name: SoundName): void {
    switch (name) {
      case "hover":
        return this.hover()
      case "click":
        return this.clickSnap()
      case "glitch":
        return this.glitchBurst()
      case "materialize":
        return this.materializeThud()
      case "dissolve":
        return this.dissolveShimmer()
      case "keystroke":
        return this.keystrokeTick()
      case "whoosh":
        return this.whooshSweep()
    }
  }

  private hover(): void {
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const now = this.ctx.currentTime

    osc.type = "sine"
    osc.frequency.value = 2400
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gain)
    gain.connect(this.master)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  private clickSnap(): void {
    const bufferSize = this.ctx.sampleRate * 0.04
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1))
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = "highpass"
    filter.frequency.value = 1200
    const gain = this.ctx.createGain()
    gain.gain.value = 0.12

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    source.start()
  }

  private glitchBurst(): void {
    const now = this.ctx.currentTime
    const duration = 0.25
    const bufferSize = Math.floor(this.ctx.sampleRate * duration)
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // Bitcrushed noise
    let held = 0
    const crushRate = 8
    for (let i = 0; i < bufferSize; i++) {
      if (i % crushRate === 0) held = Math.random() * 2 - 1
      data[i] = held
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.setValueAtTime(400, now)
    filter.frequency.exponentialRampToValueAtTime(4000, now + duration * 0.5)
    filter.frequency.exponentialRampToValueAtTime(200, now + duration)
    filter.Q.value = 2

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    source.start(now)
  }

  private materializeThud(): void {
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const filter = this.ctx.createBiquadFilter()
    const gain = this.ctx.createGain()

    osc.type = "square"
    osc.frequency.setValueAtTime(60, now)
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.3)
    filter.type = "lowpass"
    filter.frequency.value = 200
    filter.Q.value = 4
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.1, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    osc.start(now)
    osc.stop(now + 0.5)
  }

  private dissolveShimmer(): void {
    const now = this.ctx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const delay = i * 0.06

      osc.type = "sine"
      osc.frequency.value = 1200 + i * 400
      gain.gain.setValueAtTime(0.001, now + delay)
      gain.gain.linearRampToValueAtTime(0.06, now + delay + 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4)

      osc.connect(gain)
      gain.connect(this.master)
      osc.start(now + delay)
      osc.stop(now + delay + 0.5)
    }
  }

  private keystrokeTick(): void {
    const now = this.ctx.currentTime
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.008)
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = 3000 + Math.random() * 1000
    filter.Q.value = 2
    const gain = this.ctx.createGain()
    gain.gain.value = 0.06

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    source.start(now)
  }

  private whooshSweep(): void {
    const now = this.ctx.currentTime
    const duration = 0.4
    const bufferSize = Math.floor(this.ctx.sampleRate * duration)
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.setValueAtTime(200, now)
    filter.frequency.exponentialRampToValueAtTime(3000, now + duration * 0.4)
    filter.frequency.exponentialRampToValueAtTime(400, now + duration)
    filter.Q.value = 1

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.08, now + duration * 0.2)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    source.start(now)
    source.stop(now + duration + 0.01)
  }
}
