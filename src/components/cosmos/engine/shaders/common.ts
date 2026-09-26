// Ported verbatim from the approved prototype (docs/superpowers/specs/assets/
// 2026-09-26-wormhole-study.html) unless a comment marks a delta.

export const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
precision highp samplerCube;
`

export const COMMON = `
#define PI 3.14159265359
uniform float uPx;
uniform float uTime;
uniform vec3 uBandN;
uniform samplerCube uNeb;
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 hash32(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yzz) * p3.zyx); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3. - 2. * f);
  float a = hash13(i), b = hash13(i + vec3(1,0,0)), c = hash13(i + vec3(0,1,0)), d = hash13(i + vec3(1,1,0));
  float e = hash13(i + vec3(0,0,1)), g = hash13(i + vec3(1,0,1)), h = hash13(i + vec3(0,1,1)), k = hash13(i + vec3(1,1,1));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z);
}
float fbm(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.02 + vec3(1.7, 9.2, 3.1); a *= .5; } return s; }
vec3 srgbToLin(vec3 c){ return pow(max(c, 0.), vec3(2.2)); }
vec3 linToSrgb(vec3 c){ return pow(max(c, 0.), vec3(1. / 2.2)); }
vec3 rotAxis(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c); }
// Stars are sized from pxA, the angle one output pixel covers along the mapped
// direction, so they stay pin-sharp through any lens magnification. Where cells
// shrink below a few pixels the layer fades to its average glow instead of aliasing.
vec3 starLayer(vec3 d, float N, float seed, float bright, float pw, vec3 ca, vec3 cb, float sizeMul, float pxA, float mu){
  vec3 a = abs(d); vec2 uv; float face;
  if (a.x >= a.y && a.x >= a.z) { face = d.x > 0. ? 0. : 1.; uv = d.yz / a.x; }
  else if (a.y >= a.z) { face = d.y > 0. ? 2. : 3.; uv = d.xz / a.y; }
  else { face = d.z > 0. ? 4. : 5.; uv = d.xy / a.z; }
  vec2 g = uv * N; vec2 id0 = floor(g);
  float cellPx = clamp(pxA * N, 1e-5, 4.);
  float sig = cellPx * 0.6 * sizeMul;
  float resolve = 1. - smoothstep(0.22, 0.6, cellPx);
  vec3 col = vec3(0.);
  if (resolve > 0.) {
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 id = id0 + vec2(float(i), float(j));
      vec3 h = hash32(id + vec2(face * 57.31 + seed, seed * 1.7));
      vec2 dv = g - (id + 0.12 + 0.76 * h.xy);
      float b = pow(h.z, pw);
      if (b < 0.004) continue;
      float r2 = dot(dv, dv) / (sig * sig);
      float k = exp(-r2);
      if (b > 0.2) k += exp(-r2 * 0.06) * 0.045 * smoothstep(0.2, 0.9, b);
      if (h.z > 0.9965) k += smoothstep(0.9965, 1.0, h.z) * 0.1 *
        (exp(-abs(dv.x) / (sig * 10.)) * exp(-dv.y * dv.y / (sig * sig * 0.2)) + exp(-abs(dv.y) / (sig * 10.)) * exp(-dv.x * dv.x / (sig * sig * 0.2)));
      col += mix(ca, cb, hash12(id + seed + face)) * b * k;
    }
    col *= resolve;
  }
  col += (ca + cb) * 0.5 * (3.14159 * sig * sig / (pw + 1.)) * (1. - resolve);
  return col * bright * mu;
}
// Lensing conserves surface brightness: a squeezed patch of sky shows more stars,
// each dimmer by the magnification. Brightening of magnified stars is capped.
float lensMu(float pxA){ float m = uPx / max(pxA, 1e-6); return min(m * m, 2.5); }
vec3 destSky(vec3 d, float pxA){
  float mu = lensMu(pxA);
  vec3 bg = vec3(0.0009, 0.0011, 0.0024);
  vec3 neb = texture(uNeb, d).rgb;
  float band = exp(-pow(dot(d, uBandN) * 3.0, 2.));
  vec3 s1 = starLayer(d, 36., 1.7, 3.0, 36., vec3(0.64, 0.76, 1.0), vec3(1.0, 0.83, 0.66), 1.0, pxA, mu);
  vec3 s2 = starLayer(d, 105., 5.3, 0.6 + band * 1.3, 22., vec3(0.72, 0.80, 1.0), vec3(0.98, 0.92, 0.86), 0.9, pxA, mu);
  vec3 s3 = vec3(0.);
#ifdef COSMOS_HIGH
  s3 = starLayer(d, 290., 9.1, 0.16 + band * 0.9, 12., vec3(0.70, 0.78, 1.0), vec3(0.92, 0.92, 1.0), 0.85, pxA, mu);
#endif
  return bg + neb + s1 + s2 + s3;
}
vec3 originSky(vec3 d, float pxA){
  float mu = lensMu(pxA);
  vec3 dd = rotAxis(d, vec3(0.2, 0.9, 0.37), uTime * 0.006);
  vec3 s = starLayer(dd, 22., 11., 0.9, 2.2, vec3(0.39, 0.24, 0.78), vec3(0.31, 0.71, 0.86), 2.4, pxA, mu);
  s += starLayer(dd, 34., 23., 0.6, 3.5, vec3(0.78, 0.43, 0.63), vec3(0.24, 0.39, 0.86), 1.8, pxA, mu);
  return srgbToLin(vec3(0.0667) + min(s * 0.42, vec3(0.6)));
}
`
