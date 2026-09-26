// Ported verbatim from the approved prototype (docs/superpowers/specs/assets/
// 2026-09-26-wormhole-study.html) unless a comment marks a delta.

export const FS_NEB = `
out vec4 o;
uniform int uFace; uniform float uSize;
vec3 faceDir(int f, vec2 uv){
  if (f == 0) return vec3(1., -uv.y, -uv.x);
  if (f == 1) return vec3(-1., -uv.y, uv.x);
  if (f == 2) return vec3(uv.x, 1., uv.y);
  if (f == 3) return vec3(uv.x, -1., -uv.y);
  if (f == 4) return vec3(uv.x, -uv.y, 1.);
  return vec3(-uv.x, -uv.y, -1.);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uSize * 2. - 1.;
  vec3 d = normalize(faceDir(uFace, uv));
  float band = exp(-pow(dot(d, uBandN) * 2.4, 2.));
  float n = fbm(d * 1.8 + vec3(3.1, 1.7, 5.2));
  float n2 = fbm(d * 4.1 + vec3(9.1, 2.2, 4.4));
  float n3 = fbm(d * 8.7 - vec3(1., 5., 2.));
  float dens = smoothstep(0.40, 0.92, n * 0.72 + band * 0.38);
  vec3 c1 = vec3(0.018, 0.028, 0.080), c2 = vec3(0.070, 0.030, 0.105), c3 = vec3(0.016, 0.060, 0.080);
  vec3 col = mix(c1, c2, smoothstep(0.32, 0.72, n2));
  col = mix(col, c3, smoothstep(0.55, 0.8, n3) * 0.55);
  col *= dens * (0.5 + 0.9 * n3);
  float dust = smoothstep(0.5, 0.74, fbm(d * 6.2 + 2.));
  col *= 1. - dust * 0.65 * band;
  col += vec3(0.008, 0.009, 0.016) * band * (0.5 + n2);
  o = vec4(col * 0.7, 1.);
}`
