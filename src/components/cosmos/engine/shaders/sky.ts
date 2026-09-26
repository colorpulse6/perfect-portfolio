// Ported verbatim from the approved prototype (docs/superpowers/specs/assets/
// 2026-09-26-wormhole-study.html) unless a comment marks a delta.

export const FS_SKY = `
in vec2 vUv; out vec4 o;
uniform mat3 uBasis; uniform vec2 uTan2;
void main(){ vec2 ndc = vUv * 2. - 1.; vec3 d = normalize(uBasis * vec3(ndc.x * uTan2.x, ndc.y * uTan2.y, 1.)); o = vec4(destSky(d, uPx), 1.); }`
