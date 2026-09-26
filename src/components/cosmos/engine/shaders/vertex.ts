// Ported verbatim from the approved prototype (docs/superpowers/specs/assets/
// 2026-09-26-wormhole-study.html) unless a comment marks a delta.

export const VS_TRI = `
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0., 1.); }`

export const VS_QUAD = `
layout(location=0) in vec2 aPos;
uniform vec4 uRect;
out vec2 vNdc;
void main(){ vec2 p = mix(uRect.xy, uRect.zw, aPos * 0.5 + 0.5); vNdc = p; gl_Position = vec4(p, 0., 1.); }`

export const VS_GAL = `
layout(location=0) in vec4 aA;
layout(location=1) in vec4 aB;
uniform mat4 uVP; uniform float uPxScale; uniform float uTime;
uniform vec3 uGC[8]; uniform vec3 uGE1[8]; uniform vec3 uGE2[8]; uniform vec3 uGN[8];
uniform float uGDim[8];
out vec3 vCol;
uniform vec3 uCamPos, uBhPos; uniform float uShadowR;
float shadowed(vec3 p){
  vec3 toB = uBhPos - uCamPos; float dB = length(toB);
  vec3 toP = p - uCamPos;
  if (dot(toP, toB) / dB <= dB) return 0.;
  float ang = acos(clamp(dot(normalize(toP), toB / dB), -1., 1.));
  return ang < asin(min(1., uShadowR / dB)) ? 1. : 0.;
}
void main(){
  int gi = int(aA.x + 0.5);
  float rho = aA.y;
  float th = aA.z + uTime * 0.05 / max(rho + 0.15, 0.2);
  vec3 p = uGC[gi] + (cos(th) * uGE1[gi] + sin(th) * uGE2[gi]) * rho + uGN[gi] * aA.w;
  vec4 clip = uVP * vec4(p, 1.);
  gl_Position = clip;
  float px = aB.a * uPxScale / max(clip.w, 0.01);
  float sz = max(px, 1.7);
  gl_PointSize = min(sz, 90.);
  vCol = clip.w > 0. ? aB.rgb * (px * px) / (sz * sz) * (1. - shadowed(p)) * uGDim[gi] : vec3(0.);
}`

export const VS_WEB = `
layout(location=0) in vec4 aP;
layout(location=1) in vec4 aQ;
uniform mat4 uVP; uniform float uPxScale; uniform float uTime; uniform float uDim;
out vec3 vCol;
uniform vec3 uCamPos, uBhPos; uniform float uShadowR;
float shadowed(vec3 p){
  vec3 toB = uBhPos - uCamPos; float dB = length(toB);
  vec3 toP = p - uCamPos;
  if (dot(toP, toB) / dB <= dB) return 0.;
  float ang = acos(clamp(dot(normalize(toP), toB / dB), -1., 1.));
  return ang < asin(min(1., uShadowR / dB)) ? 1. : 0.;
}
void main(){
  vec4 clip = uVP * vec4(aP.xyz, 1.);
  gl_Position = clip;
  float travel = fract(uTime * aQ.y + aQ.x);
  float d = aP.w - travel;
  float pulse = exp(-d * d * 700.);
  float px = aQ.w * uPxScale / max(clip.w, 0.01);
  float sz = max(px, 1.6);
  gl_PointSize = min(sz, 40.);
  vCol = clip.w > 0. ? vec3(0.55, 0.70, 1.0) * (aQ.z + pulse * 1.6) * (px * px) / (sz * sz) * (1. - shadowed(aP.xyz)) * uDim : vec3(0.);
}`

export const VS_STAR = `
layout(location=0) in vec4 aA;
layout(location=1) in vec4 aB;
layout(location=2) in float aIdx;
uniform mat4 uVP; uniform float uPxScale; uniform float uTime;
uniform vec3 uGC[8]; uniform vec3 uGE1[8]; uniform vec3 uGE2[8]; uniform vec3 uGN[8];
uniform float uEntered, uReveal, uHover;
out vec3 vCol;
uniform vec3 uCamPos, uBhPos; uniform float uShadowR;
float shadowed(vec3 p){
  vec3 toB = uBhPos - uCamPos; float dB = length(toB);
  vec3 toP = p - uCamPos;
  if (dot(toP, toB) / dB <= dB) return 0.;
  float ang = acos(clamp(dot(normalize(toP), toB / dB), -1., 1.));
  return ang < asin(min(1., uShadowR / dB)) ? 1. : 0.;
}
void main(){
  int gi = int(aA.x + 0.5);
  float rho = aA.y;
  float th = aA.z + uTime * 0.05 / max(rho + 0.15, 0.2);
  vec3 p = uGC[gi] + (cos(th) * uGE1[gi] + sin(th) * uGE2[gi]) * rho + uGN[gi] * aA.w;
  vec4 clip = uVP * vec4(p, 1.);
  gl_Position = clip;
  bool mine = abs(aA.x - uEntered) < 0.5;
  float vis = uEntered < -0.5 ? 0.22 : (mine ? mix(0.22, 1.0, uReveal) : 0.0);
  float hov = abs(aIdx - uHover) < 0.5 ? 1. : 0.;
  float tw = 0.86 + 0.14 * sin(uTime * 2.3 + aIdx * 1.7);
  float px = aB.a * (1. + hov * 0.45) * uPxScale / max(clip.w, 0.01);
  float sz = max(px, 2.);
  gl_PointSize = min(sz, 140.);
  vCol = clip.w > 0. ? aB.rgb * 3.2 * vis * tw * (1. + hov * 1.3) * (px * px) / (sz * sz) * (1. - shadowed(p)) : vec3(0.);
}`
