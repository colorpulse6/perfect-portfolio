// Ported verbatim from the approved prototype (docs/superpowers/specs/assets/
// 2026-09-26-wormhole-study.html) unless a comment marks a delta.

export const FS_PT = `
in vec3 vCol; out vec4 o;
void main(){ vec2 c = gl_PointCoord * 2. - 1.; float r2 = dot(c, c); if (r2 > 1.) discard; o = vec4(vCol * exp(-r2 * 4.2), 1.); }`

export const FS_STAR = `
in vec3 vCol; out vec4 o;
void main(){
  vec2 c = gl_PointCoord * 2. - 1.; float r2 = dot(c, c); if (r2 > 1.) discard;
  float core = exp(-r2 * 16.);
  float halo = exp(-r2 * 3.2) * 0.3;
  float spike = (exp(-abs(c.x) * 36.) * exp(-c.y * c.y * 2.6) + exp(-abs(c.y) * 36.) * exp(-c.x * c.x * 2.6)) * 0.22;
  o = vec4(vCol * (core + halo + spike), 1.);
}`

export const FS_DOWN = `
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc; uniform vec2 uTexel; uniform float uPrefilter;
void main(){
  vec2 t = uTexel;
  vec3 c = (texture(uSrc, vUv + t * vec2(-1., -1.)).rgb + texture(uSrc, vUv + t * vec2(1., -1.)).rgb
          + texture(uSrc, vUv + t * vec2(-1., 1.)).rgb + texture(uSrc, vUv + t * vec2(1., 1.)).rgb) * 0.25;
  if (uPrefilter > 0.5) {
    float br = max(c.r, max(c.g, c.b));
    float soft = clamp(br - 0.8, 0., 0.5); soft = soft * soft / 0.5;
    c *= max(soft, br - 1.0) / max(br, 1e-4);
  }
  o = vec4(c, 1.);
}`

export const FS_UP = `
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc; uniform vec2 uTexel;
void main(){
  vec2 t = uTexel;
  vec3 s = texture(uSrc, vUv + t * vec2(-1., -1.)).rgb + 2. * texture(uSrc, vUv + t * vec2(0., -1.)).rgb + texture(uSrc, vUv + t * vec2(1., -1.)).rgb
         + 2. * texture(uSrc, vUv + t * vec2(-1., 0.)).rgb + 4. * texture(uSrc, vUv).rgb + 2. * texture(uSrc, vUv + t * vec2(1., 0.)).rgb
         + texture(uSrc, vUv + t * vec2(-1., 1.)).rgb + 2. * texture(uSrc, vUv + t * vec2(0., 1.)).rgb + texture(uSrc, vUv + t * vec2(1., 1.)).rgb;
  o = vec4(s / 16., 1.);
}`

export const FS_COMP = `
#ifndef BLUR_TAPS
#define BLUR_TAPS 24
#endif
in vec2 vUv; out vec4 o;
uniform sampler2D uHdr, uBloom;
uniform vec2 uFocus; uniform float uZoom, uCA, uExposure, uBloomK, uTime, uAspect, uGrain, uVig, uFlash, uStreak;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 samp(vec2 uv, vec2 dir){
  if (uCA < 1e-5) return texture(uHdr, uv).rgb;
  vec2 off = dir * uCA;
  return vec3(texture(uHdr, uv + off).r, texture(uHdr, uv).g, texture(uHdr, uv - off).b);
}
vec3 tonemap(vec3 x){
  vec3 k = vec3(0.74);
  vec3 over = max(x - k, 0.);
  vec3 y = min(x, k) + (1. - k) * (1. - exp(-over / (1. - k)));
  float l = dot(x, vec3(0.2126, 0.7152, 0.0722));
  return mix(y, vec3(dot(y, vec3(0.2126, 0.7152, 0.0722))), smoothstep(2.0, 10., l) * 0.55);
}
void main(){
  vec2 dir = vUv - uFocus;
  vec3 col;
  if (uZoom > 1e-4) {
    vec3 acc = vec3(0.); float tw = 0.;
    float jit = hash12(gl_FragCoord.xy + fract(uTime * 3.7) * 97.);
    for (int i = 0; i < BLUR_TAPS; i++) { float f = (float(i) + jit) / float(BLUR_TAPS); float w = 1. - 0.6 * f; acc += samp(vUv - dir * uZoom * f, dir) * w; tw += w; }
    col = acc / tw;
  } else col = samp(vUv, dir);
  col += texture(uBloom, vUv).rgb * uBloomK;
  if (uStreak > 0.) {
    vec3 st = vec3(0.);
    for (int i = 1; i <= 12; i++) { float f = float(i) / 12.; float w = exp(-f * 3.2); st += (texture(uBloom, vUv + vec2(f * 0.32, 0.)).rgb + texture(uBloom, vUv - vec2(f * 0.32, 0.)).rgb) * w; }
    col += st * vec3(0.5, 0.68, 1.0) * uStreak * 0.16;
  }
  col *= uExposure;
  col += uFlash * vec3(0.72, 0.86, 1.0);
  col = tonemap(col);
  float vig = 1. - smoothstep(0.5, 1.25, length((vUv - 0.5) * vec2(uAspect, 1.)));
  col *= mix(1., vig, uVig);
  col = pow(max(col, 0.), vec3(1. / 2.2));
  col += (hash12(gl_FragCoord.xy + fract(uTime * 7.13) * 391.) - 0.5) * uGrain;
  o = vec4(col, 1.);
}`
