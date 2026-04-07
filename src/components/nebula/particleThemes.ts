export interface ParticleTheme {
  colors: [number, number, number][]
  driftMultiplier: number
  orbitMultiplier: number
  damping: number
  brightnessRange: [number, number]
  opacity: number
}

const home: ParticleTheme = {
  colors: [
    [0.39, 0.24, 0.78],
    [0.24, 0.39, 0.86],
    [0.55, 0.31, 0.82],
    [0.78, 0.43, 0.63],
    [0.27, 0.55, 0.78],
    [0.47, 0.24, 0.55],
    [0.31, 0.71, 0.86],
    [0.78, 0.55, 0.86],
  ],
  driftMultiplier: 1.0,
  orbitMultiplier: 1.0,
  damping: 0.94,
  brightnessRange: [0.12, 0.45],
  opacity: 0.45,
}

const about: ParticleTheme = {
  colors: [
    [0.86, 0.65, 0.31],
    [0.78, 0.55, 0.24],
    [0.90, 0.78, 0.55],
    [0.70, 0.50, 0.30],
    [0.85, 0.70, 0.50],
    [0.75, 0.60, 0.40],
  ],
  driftMultiplier: 0.6,
  orbitMultiplier: 0.7,
  damping: 0.96,
  brightnessRange: [0.08, 0.35],
  opacity: 0.35,
}

const projects: ParticleTheme = {
  colors: [
    [0.55, 0.31, 0.82],
    [0.47, 0.24, 0.70],
    [0.63, 0.39, 0.86],
    [0.39, 0.24, 0.78],
    [0.70, 0.45, 0.90],
    [0.31, 0.20, 0.63],
  ],
  driftMultiplier: 1.1,
  orbitMultiplier: 1.3,
  damping: 0.93,
  brightnessRange: [0.15, 0.50],
  opacity: 0.45,
}

const writing: ParticleTheme = {
  colors: [
    [0.24, 0.31, 0.47],
    [0.20, 0.27, 0.39],
    [0.31, 0.35, 0.47],
    [0.27, 0.31, 0.43],
  ],
  driftMultiplier: 0.3,
  orbitMultiplier: 0.4,
  damping: 0.97,
  brightnessRange: [0.04, 0.18],
  opacity: 0.25,
}

const changelog: ParticleTheme = {
  colors: [
    [0.24, 0.55, 0.47],
    [0.31, 0.63, 0.55],
    [0.20, 0.47, 0.39],
    [0.27, 0.55, 0.78],
    [0.39, 0.70, 0.55],
    [0.24, 0.39, 0.86],
  ],
  driftMultiplier: 0.9,
  orbitMultiplier: 1.0,
  damping: 0.94,
  brightnessRange: [0.10, 0.40],
  opacity: 0.40,
}

const contact: ParticleTheme = {
  colors: [
    [0.35, 0.30, 0.50],
    [0.30, 0.28, 0.42],
    [0.40, 0.35, 0.55],
  ],
  driftMultiplier: 0.4,
  orbitMultiplier: 0.3,
  damping: 0.97,
  brightnessRange: [0.05, 0.20],
  opacity: 0.30,
}

const THEMES: Record<string, ParticleTheme> = {
  home,
  about,
  projects,
  writing,
  changelog,
  contact,
}

export function resolveTheme(pathname: string): ParticleTheme {
  const segment = pathname.replace(/^\/|\/$/g, "").split("/")[0] || "home"
  return THEMES[segment] || home
}
