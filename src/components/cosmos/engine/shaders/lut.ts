// Ported verbatim from the approved prototype (docs/superpowers/specs/assets/
// 2026-09-26-wormhole-study.html) unless a comment marks a delta.

export const FS_LUT = `
layout(location=0) out vec4 o;
layout(location=1) out vec4 o2;
uniform float uL, uA, uM, uW; uniform vec4 uMap;
#define PI 3.14159265359
float rOf(float l){ float x = max(abs(l) - uA, 0.); float xx = 2. * x / (PI * uM); return 1. + uM * (xx * atan(xx) - 0.5 * log(1. + xx * xx)); }
float drOf(float l){ float x = abs(l) - uA; if (x <= 0.) return 0.; float xx = 2. * x / (PI * uM); return (l > 0. ? 1. : -1.) * (2. / PI) * atan(xx); }
float chiFromU(float u){
  float c1 = uMap.y, c2 = uMap.z;
  if (u < 0.40) return c1 * u / 0.40;
  if (u < 0.75) return c1 + (c2 - c1) * (u - 0.40) / 0.35;
  float s = (u - 0.75) / 0.25; return c2 + (PI - c2) * s * s;
}
void main(){
  float u = (gl_FragCoord.x - 0.5) / (uW - 1.);
  float chi = chiFromU(u);
  float l = uL;
  float b = rOf(l) * sin(chi);
  float pl = -cos(chi);
  float phi = 0.;
  float esc = 0.;
  float b2 = b * b;
  float glow = 0.;
  for (int i = 0; i < 1100; i++) {
    float r = rOf(l);
    if (abs(l) > 40. && pl * l > 0.) { esc = 1.; break; }
    float h = max(min(0.3 * r, 0.045 * r * r / max(b, 0.02)), 0.002);
    float k1l = pl;                  float k1p = b2 * drOf(l) / (r * r * r);        float k1f = b / (r * r);
    float l2 = l + 0.5 * h * k1l;    float r2 = rOf(l2); float p2 = pl + 0.5 * h * k1p;
    float k2l = p2;                  float k2p = b2 * drOf(l2) / (r2 * r2 * r2);    float k2f = b / (r2 * r2);
    float l3 = l + 0.5 * h * k2l;    float r3 = rOf(l3); float p3 = pl + 0.5 * h * k2p;
    float k3l = p3;                  float k3p = b2 * drOf(l3) / (r3 * r3 * r3);    float k3f = b / (r3 * r3);
    float l4 = l + h * k3l;          float r4 = rOf(l4); float p4 = pl + h * k3p;
    float k4l = p4;                  float k4p = b2 * drOf(l4) / (r4 * r4 * r4);    float k4f = b / (r4 * r4);
    l += h * (k1l + 2. * k2l + 2. * k3l + k4l) / 6.;
    pl += h * (k1p + 2. * k2p + 2. * k3p + k4p) / 6.;
    phi += h * (k1f + 2. * k2f + 2. * k3f + k4f) / 6.;
    glow += h * b2 * exp(-pow(max(abs(l) - uA, 0.) / 0.45, 2.));
  }
  float rE = rOf(l);
  float phiInf = phi + asin(clamp(b / rE, 0., 1.));
  o = vec4(cos(phiInf), sin(phiInf), l < 0. ? 1. : 0., esc);
  o2 = vec4(1. - exp(-glow * 0.35), 0., 0., 1.);
}`
