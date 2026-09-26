// Ported verbatim from the approved prototype (docs/superpowers/specs/assets/
// 2026-09-26-wormhole-study.html) unless a comment marks a delta.

export { HEAD, COMMON } from "./common"
export { VS_TRI, VS_QUAD, VS_GAL, VS_WEB, VS_STAR } from "./vertex"
export { FS_LUT } from "./lut"
export { FS_NEB } from "./nebula"
export { FS_SKY } from "./sky"
export { FS_BH } from "./blackHole"
export { FS_LENS } from "./lens"
export { FS_PT, FS_STAR, FS_DOWN, FS_UP, FS_COMP } from "./post"

/** Fragment shaders that expect COMMON (noise, stars, skies) spliced in after the defines. */
export const NEEDS_COMMON = new Set(["FS_NEB", "FS_SKY", "FS_BH", "FS_LENS"])
