export interface AudioPreset {
  droneFreq: number
  droneDetune: number
  filterCutoff: number
  noiseLevel: number
  droneLevel: number
  textureRate: number
}

const home: AudioPreset = {
  droneFreq: 55,
  droneDetune: 4,
  filterCutoff: 200,
  noiseLevel: 0.008,
  droneLevel: 0.04,
  textureRate: 0.15,
}

const about: AudioPreset = {
  droneFreq: 65,
  droneDetune: 3,
  filterCutoff: 280,
  noiseLevel: 0.005,
  droneLevel: 0.035,
  textureRate: 0.1,
}

const projects: AudioPreset = {
  droneFreq: 50,
  droneDetune: 6,
  filterCutoff: 180,
  noiseLevel: 0.01,
  droneLevel: 0.045,
  textureRate: 0.2,
}

const writing: AudioPreset = {
  droneFreq: 73,
  droneDetune: 2,
  filterCutoff: 150,
  noiseLevel: 0.003,
  droneLevel: 0.02,
  textureRate: 0.06,
}

const changelog: AudioPreset = {
  droneFreq: 58,
  droneDetune: 4,
  filterCutoff: 220,
  noiseLevel: 0.007,
  droneLevel: 0.038,
  textureRate: 0.12,
}

const contact: AudioPreset = {
  droneFreq: 82,
  droneDetune: 2,
  filterCutoff: 160,
  noiseLevel: 0.004,
  droneLevel: 0.025,
  textureRate: 0.08,
}

const PRESETS: Record<string, AudioPreset> = {
  home,
  about,
  projects,
  writing,
  changelog,
  contact,
}

export function resolveAudioPreset(pathname: string): AudioPreset {
  const segment = pathname.replace(/^\/|\/$/g, "").split("/")[0] || "home"
  return PRESETS[segment] || home
}
