// Types for the AtlasCanvas render loop's mutable scene state and the scene
// objects built by `buildScene()`. These are extracted purely to give the
// `useRef` state and the draw helpers real types — there is no runtime logic
// here. Field names/types match exactly what AtlasCanvas.tsx reads and writes.

import type { AtlasDomain, AtlasWork, RGB } from "./atlasShared"

/** A 3D world position [x, y, z]. */
export type Vec3 = [number, number, number]

/** A cluster hub augmented with its computed world position. */
export interface HubWithWorld extends AtlasDomain {
  w: Vec3
}

/** A dust / bright / hub node in the cluster point-cloud. */
export interface SceneNode {
  ci: number // index of the owning hub
  w: Vec3
  r: number
  c: string
  warm?: boolean
  tw?: number // twinkle phase (absent on hub nodes)
  hub: boolean
  dust?: boolean
  label?: string // only on hub nodes
}

/** A background field star. */
export interface SceneStar {
  w: Vec3
  r: number
  tw: number
}

/** One member of an orb's nervous swarm (the drawOrb cache). */
export interface OrbMember {
  a: number
  rad: number
  sp: number
  wob: number
  sz: number
}

/**
 * The cache `drawOrb` reads/writes on whatever object it is handed. In practice
 * a `SceneOrbit` (planet) is passed, which is why `SceneOrbit extends OrbHive`.
 */
export interface OrbHive {
  seed?: number
  hive?: OrbMember[]
}

/** A project/essay body orbiting a hub-star. */
export interface SceneOrbit extends OrbHive {
  work: AtlasWork
  c: string
  rgb: RGB
  shell: number
  orbitR: number
  ang: number
  speed: number
  size: number
  inc: number
  seed: number
}

/** Everything `buildScene()` returns. `planets[i]` aligns with `hubs[i]`. */
export interface Scene {
  hubs: HubWithWorld[]
  nodes: SceneNode[]
  stars: SceneStar[]
  planets: SceneOrbit[][]
}

/** A signal pip travelling along a constellation edge. */
export interface Signal {
  e: [number, number] // [fromHubIndex, toHubIndex]
  p: number // progress 0..1
  sp: number // speed
}

/** A per-frame hit region for a planet (screen space). */
export interface PlanetHit {
  x: number
  y: number
  r: number
  pi: number // planet index within the entered hub's system
  label?: {
    x: number
    y: number
    w: number
    h: number
  }
}

/** A per-frame hit region for the fiction sub-star (screen space). */
export interface FictionHit {
  x: number
  y: number
  r: number
}

/** A projected world point in screen space. */
export interface Projected {
  sx: number
  sy: number
  z: number
  scale: number
}

/** The camera/projection inputs `proj` reads off the scene state. */
export type ProjFn = (w: number[], s: SceneState) => Projected

/** The complete mutable state held in AtlasCanvas's `st` ref. */
export interface SceneState {
  // camera
  rx: number
  ry: number
  zoom: number
  // drag / inertia
  drag: boolean
  lx: number
  ly: number
  vrx: number
  vry: number
  lastUser: number
  dx0?: number
  dy0?: number
  // hover / focus
  hover: number
  focus: number
  hoverPlanet: number
  hoverFiction?: boolean
  // warp / enter / exit
  entered: number
  enterP: number
  warpStart?: number
  warpEnv?: number
  exiting?: boolean
  exitStart?: number
  exitHub?: number
  userZoomed?: boolean
  // edge signals
  signals: Signal[]
  // pan
  pan: { x: number; y: number }
  panTX: number
  panTY: number
  // per-frame hit regions
  _planetHits: PlanetHit[] | null
  _fictionHit?: FictionHit | null
  // touch
  tapX?: number
  tapY?: number
  tapStart?: number
  moved?: number
  pinchD?: number
  pinchZoom?: number
}
