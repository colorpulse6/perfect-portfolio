/**
 * Quality tiers. High is the approved look on laptops and desktops; balanced
 * trims the expensive passes for phones and low-core devices. Adaptive
 * resolution (in the stage) handles whatever the tier choice misses.
 */
export type Tier = "high" | "balanced"

export interface TierSettings {
  tier: Tier
  dprCap: number
  /** Destination (Atlas-through-the-wormhole) target: max side and fraction of the screen's max side. */
  rtMax: number
  rtScale: number
  lutW: number
  pointsPerGalaxy: number
  bhSteps: number
  blurTaps: number
  high: boolean
}

export function detectTier(): Tier {
  if (typeof window === "undefined") return "high"
  const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
  const shortSide = Math.min(window.screen?.width || 9999, window.screen?.height || 9999)
  const cores = navigator.hardwareConcurrency || 8
  if ((coarse && shortSide <= 900) || cores <= 4) return "balanced"
  return "high"
}

export function tierSettings(tier: Tier): TierSettings {
  return tier === "high"
    ? { tier, dprCap: 2, rtMax: 2048, rtScale: 0.95, lutW: 4096, pointsPerGalaxy: 2600, bhSteps: 280, blurTaps: 24, high: true }
    : { tier, dprCap: 1.5, rtMax: 1280, rtScale: 0.8, lutW: 2048, pointsPerGalaxy: 1200, bhSteps: 160, blurTaps: 12, high: false }
}

/** Preprocessor lines spliced after `#version` in every fragment shader. */
export function shaderDefines(s: TierSettings): string {
  return `${s.high ? "#define COSMOS_HIGH\n" : ""}#define BH_STEPS ${s.bhSteps}\n#define BLUR_TAPS ${s.blurTaps}\n`
}
