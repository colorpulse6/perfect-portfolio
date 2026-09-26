// Ported verbatim from the approved prototype (docs/superpowers/specs/assets/
// 2026-09-26-wormhole-study.html) unless a comment marks a delta.

export const FS_BH = `
#ifndef BH_STEPS
#define BH_STEPS 280
#endif
in vec2 vNdc; out vec4 o;
uniform mat3 uBasis; uniform vec2 uTan2; uniform vec3 uCamPos;
uniform vec3 uBhPos; uniform float uRs; uniform mat3 uDisk; uniform float uOpaque;
const float RIN = 3.0, ROUT = 7.5, RW0 = 6.5, RW1 = 10.5;
vec3 accel(vec3 p, float h2){ float r2 = dot(p, p); float r = sqrt(r2); float w = 1. - smoothstep(RW0, RW1, r); return -1.5 * h2 * p / (r2 * r2 * r) * w; }
vec4 disk(vec3 hit, vec3 vel, float r){
  float ang = atan(hit.z, hit.x);
  float t = RIN / r;
  float temp = pow(t, 0.75) * pow(max(1. - sqrt(t), 0.), 0.25) / 0.488;
  float v = sqrt(0.5 / r);
  vec3 tang = normalize(vec3(-hit.z, 0., hit.x));
  float cosT = dot(tang, -normalize(vel));
  float delta = 1. / (inversesqrt(1. - v * v) * (1. - v * cosT));
  float grav = sqrt(max(1. - 1. / r, 0.));
  float g = mix(1., delta, 0.38) * grav;
  float a2 = ang + (v / r) * uTime * 1.6;
  float n = fbm(vec3(cos(a2) * 1.6, sin(a2) * 1.6, r * 2.3));
  float n2 = fbm(vec3(cos(a2) * 5.0, sin(a2) * 5.0, r * 6.0));
  float streak = 0.35 + 1.1 * n * n + 0.35 * n2;
  float I = temp * pow(g, 3.2) * streak;
  vec3 hot = vec3(1.0, 0.9, 0.78), warm = vec3(1.0, 0.5, 0.18);
  vec3 c = mix(warm, hot, clamp(temp * g * 1.25 - 0.35, 0., 1.)) * I * 2.4;
  float edge = smoothstep(RIN * 0.92, RIN * 1.12, r) * (1. - smoothstep(ROUT * 0.55, ROUT, r));
  return vec4(c, clamp(I * 1.2, 0., 0.96) * edge);
}
void main(){
  vec3 dW = normalize(uBasis * vec3(vNdc.x * uTan2.x, vNdc.y * uTan2.y, 1.));
  mat3 inv = transpose(uDisk);
  vec3 pos = inv * (uCamPos - uBhPos) / uRs;
  vec3 vel = inv * dW;
  float B = dot(pos, vel), C = dot(pos, pos) - RW1 * RW1, disc = B * B - C;
  bool inside = disc > 0. && -B + sqrt(max(disc, 0.)) >= 0.;
  vec3 acc = vec3(0.); float alpha = 0., w = 0.; bool captured = false;
  if (inside) {
    pos += vel * max(0., -B - sqrt(disc));
    vec3 hv = cross(pos, vel); float h2 = dot(hv, hv);
    w = 1. - smoothstep(RW0 * 0.8, RW1 * 0.95, sqrt(h2));
    for (int i = 0; i < BH_STEPS; i++) {
      float r = length(pos);
      float dt = clamp(0.11 * r - 0.08, 0.018, 0.85);
      vec3 p0 = pos;
      vec3 k1v = accel(pos, h2),                   k1p = vel;
      vec3 k2v = accel(pos + 0.5 * dt * k1p, h2),  k2p = vel + 0.5 * dt * k1v;
      vec3 k3v = accel(pos + 0.5 * dt * k2p, h2),  k3p = vel + 0.5 * dt * k2v;
      vec3 k4v = accel(pos + dt * k3p, h2),        k4p = vel + dt * k3v;
      pos += dt * (k1p + 2. * k2p + 2. * k3p + k4p) / 6.;
      vel += dt * (k1v + 2. * k2v + 2. * k3v + k4v) / 6.;
      if (p0.y * pos.y < 0.) {
        float f = p0.y / (p0.y - pos.y); vec3 hit = mix(p0, pos, f); float rh = length(hit.xz);
        if (rh > RIN * 0.9 && rh < ROUT) { vec4 dc = disk(hit, vel, rh); acc += (1. - alpha) * dc.rgb * dc.a; alpha += (1. - alpha) * dc.a; if (alpha > 0.995) break; }
      }
      if (dot(pos, pos) < 1.) { captured = true; break; }
      if (dot(pos, pos) > (RW1 + 0.5) * (RW1 + 0.5) && dot(pos, vel) > 0.) break;
    }
  }
  vec3 dirOut = uDisk * normalize(vel);
  if (uOpaque > 0.5) {
    vec3 dirSky = normalize(mix(dW, dirOut, w));
    float pxS = clamp(max(length(dFdx(dirSky)), length(dFdy(dirSky))), 1e-5, 0.05);
    vec3 bg = captured ? vec3(0.) : destSky(dirSky, pxS);
    o = vec4(acc + (1. - alpha) * bg, 1.);
  } else {
    float pxA = clamp(max(length(dFdx(dirOut)), length(dFdy(dirOut))), 1e-5, 0.05);
    vec3 bg = (captured || w <= 0.) ? vec3(0.) : destSky(dirOut, pxA);
    o = vec4(acc + (1. - alpha) * w * bg, alpha + w - alpha * w);
  }
}`
