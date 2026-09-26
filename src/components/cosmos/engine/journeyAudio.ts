/**
 * The journey's synthesized score, ported from the prototype (`playJourney`):
 * a rising sub and filtered noise into the plunge, a triad sweeping up with
 * the throat light, a boom and crackle at the crossing, and a soft chord as
 * the Atlas resolves. It plays on the site's ambient AudioContext, and only
 * when the visitor has sound on.
 *
 * Times are timeline seconds (as in journeyTimeline's J); `speed` compresses
 * them for repeat journeys.
 */

type StopScore = (fadeSeconds?: number) => void

/** The score playing now, if any: leaving the Atlas early stops it. */
let active: StopScore | null = null

/** Fades out and disconnects the score that is playing, if any. */
export function stopJourneyScore(fadeSeconds?: number): void {
  active?.(fadeSeconds)
}

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const n = Math.floor(ctx.sampleRate * seconds)
  const b = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch)
    let last = 0
    for (let i = 0; i < n; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      d[i] = last * 3.5
    }
  }
  return b
}

function impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const n = Math.floor(ctx.sampleRate * seconds)
  const b = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay)
  }
  return b
}

/**
 * Starts the score now. Returns a stop function that fades the score out
 * over `fadeSeconds` and then disconnects it.
 */
export function playJourneyScore(ctx: AudioContext, speed = 1): StopScore {
  active?.(0.1)
  if (ctx.state === "suspended") void ctx.resume()
  const now = ctx.currentTime + 0.02
  const T = (s: number) => now + Math.max(0, s) / speed
  const out = ctx.createGain()
  out.gain.value = 0.8
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 4
  const verb = ctx.createConvolver()
  verb.buffer = impulse(ctx, 3.2, 2.6)
  const wet = ctx.createGain()
  wet.gain.value = 0.32
  out.connect(comp)
  comp.connect(ctx.destination)
  out.connect(verb)
  verb.connect(wet)
  wet.connect(comp)
  const end = T(7)
  const env = (g: GainNode, pts: [number, number][]) => {
    g.gain.setValueAtTime(0.0001, T(pts[0][0]))
    pts.forEach(([t, v]) => g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0001), T(t)))
  }

  // Rising sub into the plunge.
  const sub = ctx.createOscillator()
  sub.frequency.setValueAtTime(34, T(0))
  sub.frequency.exponentialRampToValueAtTime(58, T(2.25))
  const sg = ctx.createGain()
  env(sg, [[0, 0.0001], [2.2, 0.55], [2.34, 0.0001]])
  sub.connect(sg).connect(out)
  sub.start(T(0))
  sub.stop(end)

  // Band-passed noise opening up with the wormhole.
  const nz = ctx.createBufferSource()
  nz.buffer = noiseBuffer(ctx, 2)
  nz.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = "bandpass"
  bp.Q.value = 0.7
  bp.frequency.setValueAtTime(120, T(0))
  bp.frequency.exponentialRampToValueAtTime(2600, T(2.25))
  const ng = ctx.createGain()
  env(ng, [[0.1, 0.0001], [2.2, 0.5], [2.33, 0.0001]])
  nz.connect(bp).connect(ng).connect(out)
  nz.start(T(0))
  nz.stop(end)

  // A triad sweeping up with the throat light, spread across the stereo field.
  ;[0, 7, 12].forEach((semi, i) => {
    const o = ctx.createOscillator()
    o.type = "triangle"
    const f0 = 220 * Math.pow(2, semi / 12)
    o.frequency.setValueAtTime(f0, T(0.2))
    o.frequency.exponentialRampToValueAtTime(f0 * 3.2, T(2.28))
    const g = ctx.createGain()
    env(g, [[0.2, 0.0001], [2.0, 0.035], [2.32, 0.0001]])
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner()
      pan.pan.value = [-0.6, 0, 0.6][i]
      o.connect(g).connect(pan).connect(out)
    } else {
      o.connect(g).connect(out)
    }
    o.start(T(0.2))
    o.stop(end)
  })

  // The crossing: a falling boom and a high crackle.
  const boom = ctx.createOscillator()
  boom.frequency.setValueAtTime(96, T(2.3))
  boom.frequency.exponentialRampToValueAtTime(26, T(3.6))
  const bg = ctx.createGain()
  env(bg, [[2.29, 0.0001], [2.32, 0.95], [4.2, 0.0001]])
  boom.connect(bg).connect(out)
  boom.start(T(2.28))
  boom.stop(end)
  const cr = ctx.createBufferSource()
  cr.buffer = noiseBuffer(ctx, 1)
  const hp = ctx.createBiquadFilter()
  hp.type = "highpass"
  hp.frequency.value = 900
  const cg = ctx.createGain()
  env(cg, [[2.29, 0.0001], [2.305, 0.6], [2.7, 0.0001]])
  cr.connect(hp).connect(cg).connect(out)
  cr.start(T(2.28))
  cr.stop(T(3))

  // The Atlas resolves on a soft chord.
  ;[0, 3, 7, 14].forEach((semi) => {
    const o = ctx.createOscillator()
    o.frequency.value = 110 * Math.pow(2, semi / 12)
    const g = ctx.createGain()
    env(g, [[2.5, 0.0001], [3.3, 0.045], [6.5, 0.0001]])
    o.connect(g).connect(out)
    o.start(T(2.5))
    o.stop(end)
  })

  let stopped = false
  const stop: StopScore = (fadeSeconds = 0.15) => {
    if (stopped) return
    stopped = true
    if (active === stop) active = null
    const t = ctx.currentTime
    out.gain.cancelScheduledValues(t)
    out.gain.setValueAtTime(out.gain.value, t)
    out.gain.linearRampToValueAtTime(0, t + Math.max(0.01, fadeSeconds))
    window.setTimeout(() => {
      try {
        out.disconnect()
        comp.disconnect()
        wet.disconnect()
      } catch {
        // Already disconnected.
      }
    }, Math.max(0.01, fadeSeconds) * 1000 + 50)
  }
  active = stop
  return stop
}
