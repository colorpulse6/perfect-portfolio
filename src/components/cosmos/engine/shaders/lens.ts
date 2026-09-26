// Ported verbatim from the approved prototype (docs/superpowers/specs/assets/
// 2026-09-26-wormhole-study.html) unless a comment marks a delta.

export const FS_LENS = `
in vec2 vUv; out vec4 o;
uniform vec3 uCamR, uCamU, uCamF; uniform vec2 uTan;
uniform vec3 uX, uY, uZ;
uniform float uSign, uLensOn, uFade, uMagGamma;
uniform sampler2D uLut, uLut2; uniform float uLutW; uniform vec4 uMap; uniform float uTube;
uniform sampler2D uPage, uPageB; uniform float uCtaGone, uPageKeep;
uniform vec3 uHR, uHU, uHF; uniform vec2 uHTan;
uniform float uPull, uSwirl;
uniform sampler2D uDest; uniform float uDestTan; uniform mat3 uAtlasBasis;
uniform float uRim; uniform vec3 uRimCol;
uniform float uIgnite, uIgR, uIgA; uniform vec2 uMouthNdc;
float uFromChi(float chi){
  float c1 = uMap.y, c2 = uMap.z;
  if (chi < c1) return 0.40 * chi / c1;
  if (chi < c2) return 0.40 + 0.35 * (chi - c1) / (c2 - c1);
  return 0.75 + 0.25 * sqrt(max((chi - c2) / (PI - c2), 0.));
}
// Artistic inflow: content drifts and spirals toward the mouth as it opens.
vec3 inflow(vec3 D){
  if (uPull < 0.0001) return D;
  float ca = clamp(dot(D, uZ), -1., 1.);
  float a = acos(ca);
  vec3 q = D - uZ * ca; float ql = length(q);
  q = ql > 1e-6 ? q / ql : uX;
  float w = 1. - smoothstep(0.0, 1.35, a);
  float aSrc = a + uPull * w * (0.07 + 0.5 * a);
  q = rotAxis(q, uZ, uSwirl * exp(-a * 2.4));
  return uZ * cos(aSrc) + q * sin(aSrc);
}
vec2 pageUv(vec3 Ds, out float ok){
  float z = dot(Ds, uHF);
  vec2 p = vec2(dot(Ds, uHR), dot(Ds, uHU)) / (max(z, 1e-4) * uHTan);
  ok = (z > 0. && abs(p.x) < 1. && abs(p.y) < 1.) ? 1. : 0.;
  return p * 0.5 + 0.5;
}
vec3 originColor(vec3 Ds, vec2 uv, float ok, vec2 gx, vec2 gy, float keep, float pxA){
  vec3 sky = originSky(Ds, pxA);
  if (ok > 0.5) {
    vec4 pg = textureGrad(uPage, uv, gx, gy);
    if (uCtaGone > 0.) pg = mix(pg, textureGrad(uPageB, uv, gx, gy), uCtaGone);
    pg *= keep;
    if (pg.a > 0.) { vec3 s = linToSrgb(sky); s = s * (1. - pg.a) + pg.rgb; sky = srgbToLin(s); }
  }
  return sky;
}
vec3 destColor(vec3 D, float pxA){
  vec3 L = vec3(dot(D, uX), dot(D, uY), dot(D, uZ));
  vec3 sky = destSky(uAtlasBasis * L, pxA);
  if (L.z > 0.) {
    vec2 p = L.xy / (L.z * uDestTan);
    float m = max(abs(p.x), abs(p.y));
    if (m < 1.) {
      vec4 rt = texture(uDest, p * 0.5 + 0.5);
      float e = 1. - smoothstep(0.97, 1., m);
      return sky * (1. - rt.a * e) + rt.rgb * e;
    }
  }
  return sky;
}
vec2 clampGrad(vec2 g){ float l = length(g); return l > 0.08 ? g * (0.08 / l) : g; }
void main(){
  vec2 ndc = vUv * 2. - 1.;
  float asp = uTan.x / uTan.y;
  float ripple = 0.;
  if (uIgA > 0.) {
    vec2 dm = (ndc - uMouthNdc) * vec2(asp, 1.);
    float r = length(dm);
    ripple = exp(-pow((r - uIgR) / 0.03, 2.)) * uIgA;
    vec2 dirn = r > 1e-4 ? dm / r : vec2(0.);
    ndc -= dirn * ripple * 0.035 * vec2(1. / asp, 1.);
  }
  vec3 d = normalize(uCamF + ndc.x * uTan.x * uCamR + ndc.y * uTan.y * uCamU);
  vec3 col;
  vec3 Do = d, Dd = d;
  float wDest = uSign > 0. ? 0. : 1.;
  float chi = 0., lutW = 1., tubeGlow = 0.;
  if (uLensOn > 0.5) {
    vec3 T = uSign * uZ;
    float cchi = clamp(dot(d, T), -1., 1.);
    chi = acos(cchi);
    vec3 perp = d - uZ * dot(d, uZ); float pl = length(perp);
    vec3 ep = pl > 1e-6 ? perp / pl : uX;
    vec2 lutUv = vec2((uFromChi(chi) * (uLutW - 1.) + 0.5) / uLutW, 0.5);
    vec4 lut = texture(uLut, lutUv);
    lutW = lut.w;
    tubeGlow = texture(uLut2, lutUv).r;
    vec2 cs = lut.xy / max(length(lut.xy), 1e-5);
    vec2 cs0 = vec2(-cchi, sqrt(max(1. - cchi * cchi, 0.)));
    cs = normalize(mix(cs0, cs, uFade) + vec2(1e-7));
    float crossed = lut.z * uFade;
    wDest = uSign > 0. ? crossed : 1. - crossed;
    Do = -uZ * cs.x + ep * cs.y;
    vec2 csd = cs;
    if (uMagGamma > 1.001) {
      float ph = atan(cs.y, cs.x); if (ph < 0.) ph += 2. * PI;
      if (ph < PI) { ph = PI * pow(ph / PI, uMagGamma); csd = vec2(cos(ph), sin(ph)); }
    }
    Dd = uZ * csd.x + ep * csd.y;
  }
  // Page lookup is computed in uniform control flow so derivatives stay valid.
  vec3 Ds = inflow(Do);
  float ok; vec2 uv = pageUv(Ds, ok);
  vec2 gx = clampGrad(dFdx(uv)), gy = clampGrad(dFdy(uv));
  float pxO = clamp(max(length(dFdx(Ds)), length(dFdy(Ds))), 1e-5, 0.05);
  float pxD = clamp(max(length(dFdx(Dd)), length(dFdy(Dd))), 1e-5, 0.05);
  float keep = 1.;
  if (uLensOn > 0.5 && uSign > 0.) keep = mix(0.12, 1., smoothstep(1.0, 1.4, chi / max(uMap.x, 1e-4)));
  keep *= uPageKeep;
  if (wDest < 0.002) col = originColor(Ds, uv, ok, gx, gy, keep, pxO);
  else if (wDest > 0.998) col = destColor(Dd, pxD);
  else col = mix(originColor(Ds, uv, ok, gx, gy, keep, pxO), destColor(Dd, pxD), wDest);
  if (uLensOn > 0.5) {
    float rw = max(0.0016, uMap.x * 0.011);
    float sp = uMap.x * 0.012 * uRim;
    vec3 rim = vec3(exp(-pow((chi - uMap.x - sp) / rw, 2.)), exp(-pow((chi - uMap.x) / rw, 2.)), exp(-pow((chi - uMap.x + sp) / rw, 2.)));
    col += uRimCol * rim * uRim;
    col = mix(col, col * 0.55, (1. - lutW) * uFade * 0.7);
    if (uTube > 0.) {
      float psi = atan(dot(d, uY), dot(d, uX));
      float lane = vnoise(vec3(cos(psi) * 7., sin(psi) * 7., 3.1));
      float rush = vnoise(vec3(cos(psi) * 70., sin(psi) * 70., log(max(chi, 1e-3)) * 4. - uTime * 11.));
      float fine = vnoise(vec3(cos(psi) * 150., sin(psi) * 150., log(max(chi, 1e-3)) * 7. - uTime * 17.));
      float filament = pow(rush, 6.) * 5.0 + lane * 0.12;
#ifdef COSMOS_HIGH
      filament += pow(fine, 8.) * 4.0;
#endif
      vec3 tc = mix(vec3(0.46, 0.6, 1.0), vec3(0.8, 0.74, 1.0), lane);
      col += tc * pow(tubeGlow, 1.6) * filament * uTube;
    }
  }
  if (uIgnite > 0.) {
    vec2 dm = (ndc - uMouthNdc) * vec2(asp, 1.);
    float r2 = dot(dm, dm);
    col += vec3(0.78, 0.9, 1.0) * uIgnite * (exp(-r2 * 3200.) * 5. + exp(-r2 * 160.) * 0.18);
  }
  col += vec3(0.5, 0.72, 1.0) * ripple * 0.06;
  o = vec4(col, 1.);
}`
