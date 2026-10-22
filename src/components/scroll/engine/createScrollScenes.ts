import type { ScrollData } from '../data/types';
import { TECH_ICON as techIcon } from '../data/content';
import { createInput } from './input';

export function createScrollScenes(root: HTMLElement, options: { data: ScrollData }) {
const { data } = options;
const input = createInput();
let disposed = false;
let raf = 0;
let fontTimer = 0;


// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const $ = (s, r = root) => r.querySelector(s);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const $$ = (s, r = root) => Array.from(r.querySelectorAll(s));
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const clamp01 = (x) => clamp(x, 0, 1);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const mix = (a, b, t) => a + (b - a) * t;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const DEG = Math.PI / 180;
// Seeded random so reloads and captures show the same sky.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- 1. config
const q = new URLSearchParams(window.location.search);
const debug = q.has('ss-debug');
if (!debug) for (const key of ['p','v','t','dive','dt','orb','rd','rm','nogl']) q.delete(key);
// from prototype scenes.js:60: sceneParams() reads the hybrid's index (3) from this list
const DIRS = ['descent', 'orbit', 'signal', 'hybrid'];

const VERSION = root.dataset.ssVersion || 'r14';
const SCENES = data.scenes;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const sceneIndex = (id) => SCENES.findIndex((s) => s.id === id);
const N = SCENES.length;
// The Newsletter station borrows Direction B (Orbit) inside the hybrid: the
// ringed planet on the right with every letter riding its ring as a moon, the
// copy on the dark side, the sun rising over the limb as you arrive. NEWS is its
// index; the planet, its moons and the light turn with the scroll around it, and
// sideways input (section 2b) turns the moons on their own to bring another
// letter to the front.
const NEWS = sceneIndex('newsletter');
const THETA0 = 35 * DEG;      // hybrid: where the sun stands at the Newsletter hold (just past the limb, upper right)
// how much of the station's orbit is in effect: 1 at the hold, 0 beyond 0.8 of a scene away
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const orbitW = (sp) => 1 - smooth((Math.abs(sp - NEWS) - 0.45) / 0.35);
// Content comes from buildScrollData, the same source as React markup.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const adaptApp = (p) => ({ ...p, img: p.image, kind: 'app' });
const PROJECTS = data.projects.map(adaptApp);
const TOOLS = data.tools.map(adaptApp);
const WRITING = data.stories;
const ESSAYS = data.essays.map((p) => ({ ...p, img: p.image, kind: 'essay' }));
const CHANGELOG = data.changelog.map((p) => ({ ...p, kind: 'log' }));
const LETTERS = data.letters;
const TECH_ICON = techIcon;
const TECH_QUIET = /^(React|TypeScript|Node(\.js)?)$/;
const PITCH = 3;              // viewport heights of scroll per scene
const DWELL = 0.3;            // share of each scene's scroll spent holding at each end
const DEPTH = 40;             // descent: length of the star box ahead of the camera
const DEPTH_PER_SCENE = 12;   // descent: world units travelled per scene
const ORBIT_DEG = 60;         // orbit: degrees of orbit per scene

const html = document.documentElement;
const mq = matchMedia('(prefers-reduced-motion: reduce)');
const S = {
  dir: 'hybrid',
  rm: q.get('rm') === '1' || mq.matches,
  still: q.has('p'),
  stillP: parseFloat(q.get('p') || '0'),
  stillV: parseFloat(q.get('v') || '0'),
  stillT: parseFloat(q.get('t') || '6'),
  p: 0, sp: 0, vel: 0, fin: 0, time: 0, last: 0, frames: 0,
  vw: 1, vh: 1, dpr: 1, bottom: 36, solo: -1, frozen: false,
  tier: (innerWidth <= 768 || (navigator.hardwareConcurrency || 8) <= 4) ? 'balanced' : 'high',
  renderer: 'none',
};


// ---------------------------------------------------------- 2. scroll engine
const pins = SCENES.map((s) => $('#' + s.id + ' .pin'));
for (const el of pins) {
  el.__stag = $$('.stagger', el).map((g) => ({ kids: Array.from(g.children), step: parseFloat(g.dataset.step) || 0 }));
  el.__head = $('h1, h2', el);
}
// The legend is rendered by React from the same scene list.
const nav = $('.hud-nav');
const navLinks = $$('.hud-nav a');

// Each scene holds: the first and last DWELL of its scroll distance do not move the
// scene, so a headline stays put while you scroll a little, then travel resumes.
function readScroll() {
  if (DIVE.active) return;   // the dive owns the viewport; the scene position holds
  const raw = clamp(scrollY / (PITCH * S.vh), 0, N - 1), i = Math.min(Math.floor(raw), N - 2);
  S.p = raw >= N - 1 ? N - 1 : i + smooth((raw - i - DWELL) / (1 - 2 * DWELL));
}

// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function step(dt) {
  if (S.still) { S.sp = S.stillP; S.vel = S.stillV; S.fin = clamp01(1 - Math.abs(S.vel) * 4) * (1 - smooth(Math.abs(S.sp - Math.round(S.sp)) / 0.22)); return; }
  const k = S.rm ? 16 : 4.5;                      // settle rate, per second
  const prev = S.sp;
  S.sp += (S.p - S.sp) * (1 - Math.exp(-k * dt));
  const v = (S.sp - prev) / Math.max(dt, 1e-3);   // scenes per second
  S.vel += (v - S.vel) * (1 - Math.exp(-10 * dt));
  const near = Math.abs(S.sp - Math.round(S.sp));
  S.fin = (1 - smooth(near / 0.22)) * (1 - clamp01(Math.abs(S.vel) * 4));
}

// ------------------------------------------------------ 2b. the orbit engine
// Sideways input at the Newsletter station turns the ring: a sideways wheel or
// trackpad swipe, shift+wheel, a sideways touch swipe, the left and right arrow
// keys, and the two buttons under the headline. The position is in letters
// (0 is the newest at the front, N-1 the oldest), clamped: the ring has a seam
// between the oldest and the newest, so the sequence has ends. It settles as the
// scroll does: a target that holds at each letter, a smoothed position behind
// it, and a rest to the nearest letter when the input stops. Vertical scroll is
// never touched: the handlers act only on gestures that are clearly sideways,
// while this station is on screen and no dive is running.
const ORB_N = LETTERS.length;
const ORB_STEP = 360 / (ORB_N + 1);   // degrees between moons; the spare slot is the seam
const ORB_FRONT = -90;                // the front of the ring, nearest the camera
const ORB_PX = 180;                   // pixels of sideways wheel or drag per letter
const O = { raw: clamp(parseFloat(q.get('orb') || '0'), 0, ORB_N - 1), p: 0, sp: 0, vel: 0, idle: 1, fade: 1, consumed: 0, ignored: 0 };
O.p = O.sp = O.raw;
const atOrbit = () => NEWS >= 0 && Math.abs(S.sp - NEWS) < 0.45 && !DIVE.active;
const orbFront = () => clamp(Math.round(O.sp), 0, ORB_N - 1);
// dx in letters: positive brings an older letter to the front (the moons move right)
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function orbitInput(dx) { O.raw = clamp(O.raw + dx, 0, ORB_N - 1); O.idle = 0; O.consumed++; }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function orbitTo(k) { O.raw = clamp(Math.round(k), 0, ORB_N - 1); O.idle = 1; if (S.still) O.sp = O.p = O.raw; }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function stepOrbit(dt) {
  if (S.still) { O.sp = O.p = O.raw; O.vel = 0; return; }   // captures: ?orb= holds, mid-turn allowed
  O.idle += dt;
  // the input stopped: rest with a letter at the front
  if (O.idle > 0.12 && O.raw !== Math.round(O.raw)) O.raw = Math.round(O.raw);
  // the target holds at each letter for the first and last DWELL of the way, as the stations do
  const i = Math.floor(O.raw), f = O.raw - i;
  O.p = S.rm ? Math.round(O.raw) : i + smooth((f - DWELL) / (1 - 2 * DWELL));
  const prev = O.sp;
  if (S.rm) { if (O.p !== O.sp) O.fade = 0; O.sp = O.p; }   // calm motion: step, and crossfade the moons
  else O.sp += (O.p - O.sp) * (1 - Math.exp(-6 * dt));
  O.vel = (O.sp - prev) / Math.max(dt, 1e-3);
  O.fade = Math.min(1, O.fade + dt / 0.3);
}

// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function tintAt(sp) {
  const i = clamp(Math.floor(sp), 0, N - 1), j = Math.min(i + 1, N - 1);
  const f = smooth((sp - i - 0.3) / 0.5);
  return { a: mix3(SCENES[i].tint[0], SCENES[j].tint[0], f), b: mix3(SCENES[i].tint[1], SCENES[j].tint[1], f) };
}

// ----------------------------------------------------------- 3. choreography
// d = scroll position relative to the scene: negative is ahead, positive is passed.
// A pose is opacity, scale, translate (vw, vh) and a rotateY in degrees.
const POSE = {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  descent(d) {
    if (d < 0) {
      const a = clamp01(1 + d / 0.85);
      return { o: smooth((a - 0.25) / 0.45), s: mix(0.3, 1, smooth(a)), x: 0, y: 0, r: 0 };
    }
    const b = d / 0.4;
    return { o: 1 - smooth((d - 0.1) / 0.28), s: 1 + 2.2 * b * b, x: 0, y: 0, r: 0 };
  },
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  orbit(d) {
    if (d < 0) {
      const a = smooth((d + 0.6) / 0.5);
      return { o: a, s: 1, x: (1 - a) * 26, y: (1 - a) * 5, r: (1 - a) * -16 };
    }
    const b = smooth((d - 0.12) / 0.4);
    return { o: 1 - b, s: 1, x: -b * 16, y: -b * 9, r: b * 10 };
  },
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  signal(d) {
    if (d < 0) { const a = smooth((d + 0.42) / 0.26); return { o: a, s: 1, x: 0, y: (1 - a) * 4, r: 0 }; }
    const b = smooth((d - 0.1) / 0.22);
    return { o: 1 - b, s: 1, x: 0, y: -b * 4, r: 0 };
  },
  // The hybrid's dust headline at the Newsletter station: Orbit's entry (in from
  // the right, past the body) but Descent's exit clock, so the pool can change
  // owner at 0.4 past the station without a visible snap.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  orbitDust(d) {
    if (d < 0) { const a = smooth((d + 0.6) / 0.5); return { o: a, s: 1, x: (1 - a) * 26, y: (1 - a) * 5, r: 0 }; }
    const b = smooth((d - 0.1) / 0.28);
    return { o: 1 - b, s: 1, x: -b * 16, y: -b * 9, r: 0 };
  },
  // Calm motion: a crossfade only, nothing moves.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  calm(d) { return { o: 1 - smooth((Math.abs(d) - 0.22) / 0.26), s: 1, x: 0, y: 0, r: 0 }; },
};
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
POSE.hybrid = POSE.descent;   // the hybrid travels like Descent; its headlines are dust like Signal
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const pose = (d) => (S.rm ? POSE.calm : POSE.hybrid)(d);
const bodyLabels = () => S.vw > 768;   // cards hung off galaxies and stars

function applyPoses() {
  const diveFade = DIVE.active ? 1 - smooth(DIVE.t / 0.35) : 1;
  tagWrap.hidden = !bodyLabels() || (S.solo >= 0 && S.solo !== NEWS);
  for (let i = 0; i < N; i++) {
    const el = pins[i], d = S.sp - i;
    // solo (checks): every other station's pin is taken out of the layout, so
    // nothing inside it can show whatever its own styles say (the ghost check
    // compares a frame with this against the real frame; display, not visibility,
    // so the check does not lean on the logic it tests)
    const soloOff = S.solo >= 0 && S.solo !== i;
    if (soloOff !== el.__soloOff) { el.__soloOff = soloOff; el.style.display = soloOff ? 'none' : ''; }
    // Hybrid, the Newsletter station: the panel swings as in Orbit (in from the
    // right past the body, out to the upper left); its letters are moons with tags.
    const pf = i === NEWS && !S.rm ? POSE.orbit : pose;
    let P = pf(d);
    // Hybrid projects and writing: the galaxies or the constellation carry the
    // depth, so the panel only fades. Its cards leave one by one during a dive;
    // every other panel fades as one.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    const set = bodyLabels() ? SET_BY_SCENE[i] : null, hung = !!set && set.layout !== 'panel';
    if (hung) P = { ...P, s: 1 };
    else if (diveFade < 1) P = { ...P, o: P.o * diveFade };
    const on = P.o > 0.01;
    el.style.visibility = on ? 'visible' : 'hidden';
    el.inert = P.o < 0.5;
    if (set && !hung) placeMoonTags(set);
    if (!on) {
      // The round 11 ghost: a hung card is placed with its own visibility, which
      // wins over its pin's hidden, and the pin kept the opacity of its last lit
      // frame (up to 1 after a jump, a legend click or a fast scroll), so the
      // cards of a station long passed stayed on screen. A dark pin now goes to
      // opacity 0 and hides its cards itself.
      if (!el.__off) { el.__off = true; el.style.opacity = '0'; }
      if (hung && el.__cardsOn) { for (const li of el.__stag[0] ? el.__stag[0].kids : []) li.style.visibility = 'hidden'; el.__cardsOn = false; }
      continue;
    }
    el.__off = false;
    el.style.opacity = P.o.toFixed(3);
    el.style.transform = `perspective(1400px) translate3d(${P.x.toFixed(2)}vw, ${P.y.toFixed(2)}vh, 0) scale(${P.s.toFixed(4)}) rotateY(${P.r.toFixed(2)}deg)`;
    if (hung) { placeBodyLabels(el, set); continue; }
    for (const g of el.__stag) {
      // children lead or trail the group while it travels; at a hold they settle to one plane
      const n = g.kids.length, step = g.step * (1 - S.fin);
      for (let k = 0; k < n; k++) {
        const Q = pf(d + ((n - 1) / 2 - k) * step);
        const kid = g.kids[k];
        kid.style.opacity = clamp01(Q.o / Math.max(P.o, 0.02)).toFixed(3);
        // children lead or trail the group a little; the scale stays mild so nothing leaves the viewport
        kid.style.transform = `translate3d(${(Q.x - P.x).toFixed(2)}vw, ${(Q.y - P.y).toFixed(2)}vh, 0) scale(${clamp(Q.s / P.s, 0.8, 1.1).toFixed(4)})`;
      }
    }
  }
  const cur = clamp(Math.round(S.sp), 0, N - 1);
  navLinks.forEach((a, i) => { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  // the Newsletter list: the row of the letter at the front is lit, and the counter names it
  const front = orbFront();
  if (front !== frontRow) {
    letterRows.forEach((li, k) => li.classList.toggle('front', k === front));
    orbitPos.textContent = `No. ${LETTERS[front].num} of ${ORB_N}`;
    // at either end of the sequence the button that way is dimmed, not disabled, so focus stays put
    orbitBtns.forEach((b) => b.setAttribute('aria-disabled', String((b.dataset.orb === '1' && front === ORB_N - 1) || (b.dataset.orb === '-1' && front === 0))));
    frontRow = front;
  }
}

// Hybrid: each card hangs off its body (a project's galaxy, a piece's star), as
// the Atlas positions its labels from the engine each frame: outward from the
// figure in the body's own direction, always inside the safe area.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function bodyScreen(set, k, c) {
  const g = set.body.centers(c.aspect), focal = 1.25, halfH = S.vh / 2;
  const rel = g[k * 3 + 2] + c.zOf(set.scene) - c.camZ;
  const fade = rel > 0.5 ? smooth((rel - 0.3) / 1.3) * (1 - smooth((rel - DEPTH * 0.3) / (DEPTH * 0.2))) * c.alphaOf(set.scene) : 0;
  // the planet and its moons do not take the orbit's sideways camera swing: they hold still while the sky slides
  const camX = c.camXY[0] - (set.body.kind === 'moons' ? c.swing : 0);
  return {
    rel, fade,
    x: S.vw / 2 + ((g[k * 3] - camX) / rel) * focal * halfH,
    y: halfH - ((g[k * 3 + 1] - c.camXY[1]) / rel) * focal * halfH,
    radius: set.size(k) * focal * halfH / rel,
  };
}
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function placeBodyLabels(pin, set) {
  const c = sceneParams();
  const kids = pin.__stag[0] ? pin.__stag[0].kids : [];
  let any = false;
  for (let k = 0; k < kids.length; k++) {
    const li = kids[k], s = bodyScreen(set, k, c), chosen = DIVE.active && DIVE.set === set && k === DIVE.k;
    // during a dive the other cards leave first, the chosen one lifts and goes last
    const diveK = DIVE.active ? (chosen ? 1 - smooth((DIVE.t - 0.25) / 0.3) : 1 - smooth(DIVE.t / 0.3)) : 1;
    // the bodies lead; their cards materialise over the last stretch of the approach
    const near = 1 - smooth((s.rel - 6.5) / 2.5);
    const fade = s.fade * diveK * near;
    const w = li.offsetWidth || 162, h = li.offsetHeight || 150, half = w / 2, dir = set.body.dirs[k];
    // a body off the screen takes its card with it (round 11: a card used to be
    // clamped onto the screen's edge while its body was out of view)
    const off = s.x < -s.radius - w || s.x > S.vw + s.radius + w || s.y < -s.radius - h || s.y > S.vh + s.radius + h;
    if (fade < 0.02 || off) { li.style.visibility = 'hidden'; continue; }
    let x = s.x, y;
    if (dir === 'left' || dir === 'right') { x = dir === 'right' ? s.x + s.radius + 12 + half : s.x - s.radius - 12 - half; y = s.y - h / 2; }
    else y = dir === 'up' ? s.y - s.radius - 10 - h : s.y + s.radius + 10;
    x = clamp(x, 12 + half, S.vw - 12 - half);
    y = clamp(y, 56, S.vh - S.bottom - 8 - h);
    const lift = chosen ? 1 + 0.25 * smooth(DIVE.t / 0.4) : 1;
    any = true;
    li.style.visibility = 'visible';
    li.style.opacity = fade.toFixed(3);
    li.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${lift.toFixed(3)})`;
  }
  pin.__cardsOn = any;
}
// Hybrid, Newsletter: the issue number under each moon, placed each frame like
// the cards. A click on the front moon's tag dives; another tag turns its moon to
// the front. The list on the dark side is the keyboard path.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function placeMoonTags(set) {
  const c = sceneParams(), B = set.body, front = orbFront();
  for (let k = 0; k < moonTags.length; k++) {
    const tag = moonTags[k], s = bodyScreen(set, k, c), chosen = DIVE.active && DIVE.set === set && k === DIVE.k;
    const diveK = DIVE.active ? (chosen ? 1 - smooth((DIVE.t - 0.25) / 0.3) : 1 - smooth(DIVE.t / 0.3)) : 1;
    const near = 1 - smooth((s.rel - 6.5) / 2.5);
    const fade = s.fade * diveK * near * B.vis(k) * c.moonsA * O.fade;
    // a moon past the screen's edge takes its tag with it (the ring's right side leaves the screen)
    if (fade < 0.02 || s.x < -s.radius || s.x > S.vw + s.radius) { tag.style.visibility = 'hidden'; continue; }
    tag.classList.toggle('front', k === front);
    const half = (tag.offsetWidth || 26) / 2, x = clamp(s.x, 12 + half, S.vw - 12 - half), y = clamp(s.y + s.radius + 7, 56, S.vh - S.bottom - 8 - 22);
    const lift = chosen ? 1 + 0.25 * smooth(DIVE.t / 0.4) : 1;
    tag.style.visibility = 'visible';
    tag.style.opacity = fade.toFixed(3);
    tag.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, 0) scale(${lift.toFixed(3)})`;
  }
}

// ------------------------------------------------------------------ 3b. the dive
// Click a galaxy, a star, or its card: the camera plunges into that body through
// a wormhole mouth (0.8 s, the study's ignite, open, cross), lands on the detail,
// and Back reverses it. Calm motion: a crossfade. One machine for both sets.
const DIVE = { active: false, set: null, k: -1, t: 0, dir: 0, hold: false, open: false, from: null };
const detail = $('#detail');
const DIVE_SECONDS = 0.8, CALM_SECONDS = 0.3;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
// Only the hybrid has galaxies to dive into; elsewhere, and in calm motion, the
// detail crossfades.
const diveCalm = () => S.rm;
// the detail card's content for one item (the dive fills it as it starts; the
// checks fill it alone, to read every card's copy)
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function fillDetail(set, k) {
  const p = set.items[k], img = $('#detail-img'), type = $('#detail-type');
  if (p.img) { img.hidden = false; img.src = p.img; type.hidden = true; }
  else {
    // no cover art: the typographic cover at size (a number for writing, a mark for an app)
    img.hidden = true; img.removeAttribute('src'); type.hidden = false; type.className = `detail-type ${p.kind}`;
    $('#detail-type-num').textContent = p.num || p.mark;
    $('#detail-type-kind').textContent = p.kindLabel || p.medium;
  }
  $('#detail-title').textContent = p.name || p.title;
  $('#detail-meta').textContent = p.meta || `${p.medium} · ${p.status}`;
  $('#detail-blurb').textContent = p.blurb || p.excerpt;
  // an item may name its own link (round 14: Chimera's "Where the game stands")
  $('#detail-link').href = p.link; $('#detail-link-label').textContent = p.open || set.open;
  const gh = $('#detail-github'); gh.hidden = !p.github; gh.href = p.github || '#';
  $('#detail-back').textContent = set.back;
  // an app's technologies, each as its mark and its name (round 12); the names
  // kept out of the copy stand as their marks alone, named for assistive tech
  const tech = $('#detail-tech'); tech.textContent = '';
  tech.hidden = !(p.tech && p.tech.length);
  for (const name of p.tech || []) {
    const id = TECH_ICON[name]; if (!id) { console.error(`no mark for ${name}`); continue; }
    const li = document.createElement('li'), quiet = TECH_QUIET.test(name); li.dataset.name = name;
    li.innerHTML = `<svg class="ti"${quiet ? ' role="img"' : ' aria-hidden="true"'} focusable="false">${quiet ? `<title></title>` : ''}<use href="#i-${id}"/></svg>${quiet ? '' : '<span></span>'}`;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    if (quiet) { li.querySelector('title').textContent = name; li.querySelector('svg').setAttribute('aria-label', name); }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    else li.querySelector('span').textContent = name;
    tech.appendChild(li);
  }
}
// What a click on an item does: a set with `go` opens the item where it lives
// (round 13: a story goes to the site's writing page, same tab); a set with a
// detail dives to it. Letters have neither: the whole letter is on the station.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function activate(set, k, from) {
  if (DIVE.active) return;
  if (set.go) { location.assign(set.items[k].link); return; }
  if (set.open) startDive(set, k, from);
}
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function startDive(set, k, from) {
  if (DIVE.active && DIVE.dir !== 0) return;
  fillDetail(set, k);
  DIVE.active = true; DIVE.set = set; DIVE.k = k; DIVE.dir = 1; DIVE.open = false; DIVE.from = from || null;
  if (!DIVE.hold) DIVE.t = 0;
  html.classList.add('locked');
  detail.hidden = false;
}
function endDive() {
  DIVE.active = false; DIVE.dir = 0; DIVE.open = false; DIVE.t = 0;
  detail.hidden = true; detail.classList.remove('on');
  html.classList.remove('locked');
  $('#scenes').inert = false;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (DIVE.from && DIVE.from.focus) DIVE.from.focus();
}
function closeDive() { if (DIVE.active && DIVE.dir === 0) { DIVE.dir = -1; detail.classList.remove('on'); $('#scenes').inert = false; } }
function skipDive() { if (DIVE.active && DIVE.dir === 1) DIVE.t = 1; }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function stepDive(dt) {
  if (!DIVE.active || DIVE.hold) { renderDetail(); return; }
  if (DIVE.dir !== 0) DIVE.t = clamp(DIVE.t + DIVE.dir * dt / (diveCalm() ? CALM_SECONDS : DIVE_SECONDS), 0, 1);
  if (DIVE.dir === 1 && DIVE.t >= 1) {
    DIVE.dir = 0; DIVE.open = true; detail.classList.add('on'); $('#scenes').inert = true;
    $('#detail-back').focus({ preventScroll: true });
  } else if (DIVE.dir === -1 && DIVE.t <= 0) endDive();
  renderDetail();
}
function renderDetail() {
  if (!DIVE.active) return;
  const calm = diveCalm();
  const a = calm ? smooth(DIVE.t) : smooth((DIVE.t - 0.68) / 0.3);
  detail.style.opacity = a.toFixed(3);
  detail.querySelector('.detail-card').style.transform = calm ? 'none' : `scale(${(1.06 - 0.06 * a).toFixed(4)})`;
  if (DIVE.t >= 1 && !DIVE.open) { DIVE.open = true; detail.classList.add('on'); }
}
// Dive parameters for the renderers. In calm motion nothing moves.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function diveParams(aspect, camZ, zOf) {
  const z = { camXY: [0, 0], camDZ: 0, mouthPos: [0, 0], mouth: [0, 0], tail: 0, exposure: 0, flash: 0 };
  if (!DIVE.active || diveCalm() || DIVE.k < 0) return z;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const set = DIVE.set, t = DIVE.t, g = set.body.centers(aspect), k = DIVE.k;
  const gx = g[k * 3], gy = g[k * 3 + 1], rel0 = g[k * 3 + 2] + zOf(set) - camZ;
  // ignite (0 to 0.1): the mouth appears around the body. open (0.1 to 0.8): the
  // camera slides across to centre it and plunges; the mouth is a hoop in world
  // space, so it grows as it nears and passes the screen edge at about 0.74,
  // the cross. The camera parks 1.15 units short, inside the body's light.
  const move = smooth((t - 0.1) / 0.7);
  z.camXY = [gx * move, gy * move];
  z.camDZ = (rel0 - 1.15) * move * move;
  const rel = Math.max(0.3, rel0 - z.camDZ);
  z.mouthPos = [(gx - z.camXY[0]) / rel * 1.25, (gy - z.camXY[1]) / rel * 1.25];
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  z.mouth = [set.hoop(k) * 1.25 / rel, smooth(t / 0.1) * (1 - smooth((t - 0.78) / 0.14))];
  z.tail = 4.5 * bump(t, 0.58, 0.2);
  z.exposure = 0.45 * bump(t, 0.64, 0.14);
  z.flash = 0.55 * bump(t, 0.74, 0.05);
  return z;
}

// Scene parameters shared by both renderers.
function sceneParams() {
  const mode = DIRS.indexOf(S.dir);
  const sky = mode === 3 ? 0 : mode;      // the hybrid flies Descent's sky
  const vel = S.rm ? 0 : S.vel;
  const aspect = S.vw / S.vh;
  const phone = S.vw <= 768;
  let theta = S.sp * ORBIT_DEG * DEG;
  const el = 0.25;
  const perScene = S.rm ? 3 : DEPTH_PER_SCENE;
  const camZ0 = S.sp * perScene;
  // Hybrid: the project galaxies sit 6 units past the projects station, the
  // writing constellation 6 units past the writing station. In calm motion they
  // hold that distance and crossfade with their scene.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const bodyZ = (scene) => S.rm ? S.sp * perScene + 6 : scene * perScene + 6;
  // solo (checks): the bodies of stations behind the chosen one are not drawn
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const bodyAlpha = (scene) => (S.rm ? 1 - smooth((Math.abs(S.sp - scene) - 0.25) / 0.3) : 1) * (phone ? 0.7 : 1) * (S.solo >= 0 && scene < S.solo ? 0 : 1);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const dv = diveParams(aspect, camZ0, (set) => bodyZ(set.scene));
  // Hybrid, the Newsletter station: the ringed planet is a body at the station's
  // depth, so it approaches like the galaxies do; its light and its moons turn
  // with the scroll (60 degrees per scene, as in Orbit) and the sky slides a
  // little sideways as you come round. It fades in over the last stretch of the
  // approach and out again as the camera passes it: nothing pops.
  const w = mode === 3 && NEWS >= 0 ? orbitW(S.sp) : 0;
  const swing = w * (S.sp - NEWS) * 2.0;
  const camXY = [dv.camXY[0] + swing, dv.camXY[1]];
  // Orbit: the body sits on the right on desktop, rises from the bottom on phones.
  let planet = phone ? [0, -1.32, 1.02] : [aspect * 0.52, -0.16, 0.56], planetA = mode === 1 ? 1 : 0, moonsA = 0;
  if (mode === 3 && NEWS >= 0) {
    theta = THETA0 + (S.sp - NEWS) * ORBIT_DEG * DEG;
    const P = PLANET.world(aspect), rel = bodyZ(NEWS) - (camZ0 + dv.camDZ);
    if (rel > 0.3) {
      planet = [(P[0] - dv.camXY[0]) / rel * 1.25, (P[1] - dv.camXY[1]) / rel * 1.25, P[3] / rel * 1.25];
      moonsA = smooth((rel - 0.3) / 1.3) * (1 - smooth((rel - 9) / 4)) * (S.solo >= 0 && NEWS < S.solo ? 0 : 1);
      planetA = smooth((rel - 1.2) / 1.6) * (1 - smooth((rel - 9) / 4)) * bodyAlpha(NEWS);
    }
  }
  return {
    mode, sky, aspect, vel,
    tint: tintAt(S.sp),
    exposure: 1 + 0.35 * Math.min(Math.abs(vel), 1.2) + dv.exposure,
    camZ: camZ0 + dv.camDZ,
    camXY, swing,
    tail: (S.rm ? 0 : clamp(vel * 2.2, -5, 5)) + dv.tail,
    flash: dv.flash,
    angle: mode === 1 ? theta : S.sp * 0.35 + S.time * 0.01,
    twinkle: S.rm ? 0 : 1,
    zOf: bodyZ, alphaOf: bodyAlpha,
    galClock: S.rm ? 0 : S.time,
    planet, planetA, moonsA, theta,
    light: [Math.sin(theta) * Math.cos(el), Math.sin(el), -Math.cos(theta)],
    // Descent: the wormhole mouth opens ahead of the last station; during a dive
    // it opens on the chosen galaxy instead.
    mouth: dv.mouth[1] > 0 ? dv.mouth : [0.05 + 0.78 * smooth((S.sp - (N - 1.9)) / 0.9), smooth((S.sp - (N - 1.8)) / 0.6)],
    mouthPos: dv.mouthPos,
  };
}

// ----------------------------------------------------------------- 4. shaders
const HEAD = '#version 300 es\nprecision highp float;\n';
const NOISE = `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3. - 2. * f);
  float a = hash13(i), b = hash13(i + vec3(1,0,0)), c = hash13(i + vec3(0,1,0)), d = hash13(i + vec3(1,1,0));
  float e = hash13(i + vec3(0,0,1)), g = hash13(i + vec3(1,0,1)), h = hash13(i + vec3(0,1,1)), k = hash13(i + vec3(1,1,1));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z);
}
float fbm(vec3 p, int oct){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { if (i >= oct) break; s += a * vnoise(p); p = p * 2.02 + vec3(1.7, 9.2, 3.1); a *= .5; } return s; }
`;
const VS_TRI = HEAD + `
layout(location=0) in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

// Nebula, rendered small and upsampled. Same fbm family as the study's cubemap.
const FS_NEB = HEAD + NOISE + `
in vec2 vUv; out vec4 o;
uniform float uTime, uScroll, uAngle, uMode, uAspect, uExposure; uniform int uOct; uniform vec3 uA, uB;
void main(){
  vec2 uv = (vUv * 2. - 1.) * vec2(uAspect, 1.);
  vec3 p;
  if (uMode < .5) p = vec3(uv * 1.25, uScroll * .3 + uTime * .01);
  else if (uMode < 1.5) { float c = cos(uAngle * .5), s = sin(uAngle * .5); p = vec3(mat2(c, -s, s, c) * uv * 1.2, uTime * .012); }
  else p = vec3(uv * 1.1 + vec2(0., uScroll * .18), uTime * .012);
  float n = fbm(p + vec3(3.1, 1.7, 5.2), uOct);
  float n2 = fbm(p * 2.3 + vec3(9.1, 2.2, 4.4), uOct);
  float n3 = fbm(p * 4.7 - vec3(1., 5., 2.), max(uOct - 1, 2));
  // domain-warped wisps so the cloud reads as filaments, not blobs
  float wisp = fbm(p * 3.1 + vec3(n * 2.4, n2 * 1.6, 0.), max(uOct - 1, 2));
  float dens = smoothstep(.48, .98, n * .7 + wisp * .34);
  vec3 col = mix(uA, uB, smoothstep(.35, .75, n2)) * dens * (.25 + .75 * n3);
  col *= 1. - .65 * smoothstep(.48, .78, n3);
  col = col * .27 * uExposure + vec3(.004, .005, .012);
  o = vec4(col, 1.);
}`;

// Composite: nebula, the orbit body, the descent mouth, vignette, grain.
const FS_COMP = HEAD + `
in vec2 vUv; out vec4 o;
uniform sampler2D uNeb; uniform float uTime, uAspect, uMode, uGrain, uFlash;
uniform vec3 uPlanet, uLight, uTint; uniform vec2 uMouth, uMouthPos; uniform float uPlanetA;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec2 uv = (vUv * 2. - 1.) * vec2(uAspect, 1.);
  vec3 col = texture(uNeb, vUv).rgb;
  // the ringed body: Orbit's whole flight, and the hybrid's Newsletter station (faded by uPlanetA)
  if (uPlanetA > 0.) {
    vec3 pc = col;
    vec2 v = (uv - uPlanet.xy) / uPlanet.z;
    float r = length(v);
    vec3 L = normalize(uLight);
    vec3 base = mix(vec3(.16, .19, .30), uTint, .55);
    // the ring: a tilted ellipse whose far half passes behind the body
    vec2 e = vec2(v.x, v.y / .24);
    float er = length(e);
    float ringA = smoothstep(1.55, 1.66, er) * (1. - smoothstep(1.98, 2.12, er));
    ringA *= .35 + .65 * smoothstep(.15, .85, fract(er * 6.1)) * smoothstep(.5, .9, fract(er * 2.3 + .3));
    float ringLit = .25 + .75 * clamp(dot(normalize(e + 1e-5), L.xy) * .5 + .5, 0., 1.);
    bool behind = r < 1. && v.y > 0.;
    if (r < 1.) {
      vec3 n = vec3(v, sqrt(1. - r * r));
      float ndl = dot(n, L);
      float dif = clamp(ndl, 0., 1.);
      float bands = .9 + .2 * hash12(vec2(floor(n.y * 9. + 1e-3), 2.));
      pc = base * (.012 + .6 * dif * smoothstep(-.1, .2, ndl)) * bands;
      pc += uTint * pow(1. - n.z, 3.5) * .45 * (.25 + .75 * dif);
    }
    float atm = exp(-(r - 1.) * 8.) * step(1., r);
    float facing = clamp(dot(v / max(r, 1e-4), L.xy) * .5 + .5, 0., 1.);
    pc += uTint * atm * .6 * (.2 + .8 * facing);
    // the sun at the limb, when it is behind the body and peeking past it
    vec2 sunDir = normalize(L.xy + vec2(1e-4, 0.));
    float sunVis = smoothstep(.2, -.25, L.z) * smoothstep(0., .35, length(L.xy));
    float ds = length(v - sunDir * 1.02);
    float flare = (exp(-ds * ds * 70.) * 1.4 + exp(-ds * 3.5) * .09) * sunVis * step(1., r);
    pc += vec3(1., .9, .76) * flare;
    if (!behind) pc = mix(pc, vec3(1., .74, .46) * ringLit * .9, ringA * .55);
    col = mix(col, pc, uPlanetA);
  }
  if (uMode < .5 && uMouth.y > 0.) {
    // the study's rim: three bands a hair apart, so the edge has a faint chromatic fringe
    float rr = length(uv - uMouthPos);
    float w = .004 + uMouth.x * .008;
    vec3 rim = vec3(exp(-pow((rr - uMouth.x - w * .35) / w, 2.)), exp(-pow((rr - uMouth.x) / w, 2.)), exp(-pow((rr - uMouth.x + w * .35) / w, 2.)));
    col += vec3(.35, .9, .85) * rim * uMouth.y * .5;
    col += vec3(.15, .5, .5) * exp(-pow((rr - uMouth.x) / (w * 8.), 2.)) * uMouth.y * .08;
  }
  float vig = 1. - smoothstep(.55, 1.35, length(uv));
  col *= mix(.55, 1., vig);
  col += uFlash * vec3(.72, .86, 1.);
  col = pow(max(col, 0.), vec3(1. / 2.2));
  col += (hash12(gl_FragCoord.xy + fract(uTime * 7.13) * 391.) - .5) * uGrain;
  o = vec4(col, 1.);
}`;

// Stars. Mode 0 is a box the camera flies through; modes 1 and 2 read the same
// records as a parallax sheet that pans with the angle.
const VS_STAR = HEAD + `
layout(location=0) in vec4 aP;   // xyz, size
layout(location=1) in vec4 aC;   // rgb, phase
layout(location=2) in float aE;  // 0 head, 1 streak tail
uniform float uMode, uCamZ, uDepth, uAngle, uTail, uFocal, uAspect, uPx, uTime, uTwinkle;
uniform vec2 uCamXY;
out vec4 vCol;
void main(){
  vec2 ndc; float sz, fade;
  if (uMode < .5) {
    float rel = mod(aP.z - uCamZ, uDepth);
    float rel2 = max(rel + aE * uTail * (.35 + rel / uDepth), .15);
    ndc = (aP.xy - uCamXY) / rel2 * uFocal; ndc.x /= uAspect;
    fade = smoothstep(0., 1.5, rel) * (1. - smoothstep(uDepth * .55, uDepth, rel));
    fade /= 1. + abs(uTail) * aE * .6;
    sz = clamp(aP.w * uFocal * 3. / rel2, 1.9, 16.) * uPx;
  } else {
    if (aE > .5) { gl_Position = vec4(3., 3., 3., 1.); gl_PointSize = 1.; vCol = vec4(0.); return; }
    vec2 sheet = aP.xy / 7. * vec2(2.6, 1.15);
    float depth = .25 + .75 * aP.z / uDepth;
    float x = mod(sheet.x + uAngle * depth * .9 + 2.6, 5.2) - 2.6;
    ndc = vec2(x / uAspect, sheet.y);
    fade = mix(.35, 1., depth);
    sz = clamp(aP.w * mix(.7, 1.6, depth), 1.6, 6.) * uPx;
  }
  float tw = 1. - uTwinkle * .35 * (.5 + .5 * sin(uTime * (1.3 + aC.w * 2.) + aC.w * 40.));
  gl_Position = vec4(ndc, 0., 1.);
  gl_PointSize = sz;
  vCol = vec4(aC.rgb * fade * tw * 1.5, fade);
}`;
const FS_PT = HEAD + `
in vec4 vCol; out vec4 o; uniform float uLine;
void main(){
  if (uLine > .5) { o = vec4(vCol.rgb * .35, 1.); return; }
  vec2 c = gl_PointCoord * 2. - 1.; float r2 = dot(c, c); if (r2 > 1.) discard;
  o = vec4(vCol.rgb * exp(-r2 * 4.2), 1.);
}`;
// Particle headlines (signal, hybrid): positions in CSS pixels.
const VS_DOT = HEAD + `
layout(location=0) in vec4 aP;   // x, y, brightness, size
layout(location=1) in vec3 aC;
uniform vec2 uRes; uniform float uPx; out vec4 vCol;
void main(){
  gl_Position = vec4(aP.x / uRes.x * 2. - 1., 1. - aP.y / uRes.y * 2., 0., 1.);
  gl_PointSize = aP.w * uPx;
  vCol = vec4(aC * aP.z, 1.);
}`;
// Atlas galaxies and web (hybrid). Galaxy points ride their spiral exactly as
// in atlasScene.ts: theta = theta0 + t * 0.05 / max(rho + 0.15, 0.2).
const VS_GAL = HEAD + `
layout(location=0) in vec4 aP;   // galaxy: gi, rho, theta0, h    web: x, y, z, u
layout(location=1) in vec4 aC;   // galaxy: rgb, size (world)     web: phase, speed, base, size
uniform float uKind, uCamZ, uDepth, uFocal, uAspect, uPx, uPxScale, uGalZ, uClock, uAlpha;
uniform vec2 uCamXY;
uniform vec3 uGC[8], uGE1[8], uGE2[8], uGN[8];
out vec4 vCol;
void main(){
  vec3 p, col; float size;
  if (uKind < .5) {
    int gi = int(aP.x + .5);
    float rho = aP.y;
    float th = aP.z + uClock * .05 / max(rho + .15, .2);
    p = uGC[gi] + (cos(th) * uGE1[gi] + sin(th) * uGE2[gi]) * rho + uGN[gi] * aP.w;
    col = aC.rgb; size = aC.w;
  } else if (uKind > 1.5) {
    // a constellation star: its own colour, a slow twinkle
    p = aP.xyz; col = aC.rgb * (.86 + .14 * sin(uClock * 1.1 + aP.w * 6.3)); size = aC.w;
  } else {
    p = aP.xyz;
    float d = aP.w - fract(uClock * aC.y + aC.x);
    col = vec3(.55, .7, 1.) * (aC.z + exp(-d * d * 700.) * 1.6); size = aC.w;
  }
  p.z += uGalZ;
  float rel = p.z - uCamZ;
  if (rel < .3 || rel > uDepth) { gl_Position = vec4(3., 3., 3., 1.); gl_PointSize = 1.; vCol = vec4(0.); return; }
  vec2 ndc = (p.xy - uCamXY) / rel * uFocal; ndc.x /= uAspect;
  float px = size * uPxScale / rel;
  float sz = max(px, 1.6 * uPx);
  float fade = smoothstep(.3, 1.6, rel) * (1. - smoothstep(uDepth * .3, uDepth * .5, rel)) * uAlpha;
  gl_Position = vec4(ndc, 0., 1.);
  gl_PointSize = min(sz, 240.);
  // energy is conserved when a point is enlarged to its minimum size; capped so a
  // core halo passing the camera cannot flare
  vCol = vec4(col * min((px * px) / (sz * sz), 2.) * fade * 1.4, fade);
}`;

// ------------------------------------------------------------- star records
const STAR_N = S.tier === 'high' ? 2600 : 1300;
const stars = new Float32Array(STAR_N * 18);   // head and tail vertex, 9 floats each
{
  const r = rng(7);
  const cool = [0.64, 0.76, 1.0], warm = [1.0, 0.83, 0.66];
  for (let i = 0; i < STAR_N; i++) {
    const x = (r() * 2 - 1) * 7, y = (r() * 2 - 1) * 7, z = r() * DEPTH;
    const size = 0.5 + Math.pow(r(), 2.2) * 1.4;
    const c = r() < 0.7 ? cool : warm, b = 0.35 + Math.pow(r(), 1.8) * 0.65, ph = r();
    for (let e = 0; e < 2; e++) {
      const o = (i * 2 + e) * 9;
      stars[o] = x; stars[o + 1] = y; stars[o + 2] = z; stars[o + 3] = size;
      stars[o + 4] = c[0] * b; stars[o + 5] = c[1] * b; stars[o + 6] = c[2] * b; stars[o + 7] = ph; stars[o + 8] = e;
    }
  }
}

// ------------------------------------------------------ galaxy records (hybrid)
// The project galaxies (seven since round 14) built with the Atlas recipe (bulge, two log-spiral arms,
// a few bright stars, a soft core) on a ring around the flight path, joined by
// the Atlas's dotted web with travelling pulses.
// A ring of galaxies with the Atlas recipe. `L` is the layout: unit positions on
// the ring (sx, sy), depth offsets (sz), the ring radii, the card direction of
// each galaxy, and the web's edges. `seed` keeps two rings from sharing shapes.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function makeGalaxies(L, seed) {
  const G = L.sx.length, PPG = S.tier === 'high' ? 260 : 140, PER = PPG + 2;
  const V = {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const gaussFrom = (r) => () => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  // the home and about theme colours lifted, plus the Atlas's sites green and music amber
  const cols = [[0.31, 0.71, 0.86], [0.55, 0.31, 0.82], [0.24, 0.39, 0.86], [0.78, 0.43, 0.63], [0.86, 0.65, 0.31], [0.78, 0.55, 0.86], [0.27, 0.78, 0.61], [0.95, 0.67, 0.28]];
  const pts = new Float32Array(G * PER * 8);
  const e1 = new Float32Array(G * 3), e2 = new Float32Array(G * 3), nn = new Float32Array(G * 3), sizes = [];
  let o = 0;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const put = (...v) => { for (const x of v) pts[o++] = x; };
  for (let gi = 0; gi < G; gi++) {
    const shape = rng(seed + gi * 7919), sg = gaussFrom(shape), r = rng(seed + gi * 7919 + 104729), gauss = gaussFrom(r);
    const rnd = V.norm([sg(), sg(), sg()]);
    const n = V.norm([rnd[0] * 0.85, rnd[1] * 0.85, -0.75 + rnd[2] * 0.85]);   // mostly facing the camera
    const a = V.norm(V.cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), b = V.cross(n, a);
    e1.set(a, gi * 3); e2.set(b, gi * 3); nn.set(n, gi * 3);
    // `scales` (round 14): one galaxy's own factor, for the apex that must clear the headline
    const size = (1.0 + shape() * 0.4) * (L.scale || 1) * ((L.scales && L.scales[gi]) || 1), pitch = 0.3 + shape() * 0.14, col = cols[gi % cols.length];
    sizes.push(size);
    for (let i = 0; i < PPG; i++) {
      let rho, th, h, inten, sz, cc;
      if (i < PPG * 0.16) {
        rho = Math.abs(gauss()) * size * 0.11; th = r() * Math.PI * 2; h = gauss() * size * 0.06;
        cc = mix3(col, [1, 0.93, 0.86], 0.72); inten = 0.8 + r() * 0.8; sz = 0.04;
      } else {
        const t = Math.pow(r(), 0.85);
        rho = size * (0.07 + 0.93 * t);
        th = (i % 2) * Math.PI + Math.log((rho / size) * 9 + 1) / Math.tan(pitch) + gauss() * 0.26 * (1 - 0.35 * t);
        h = gauss() * size * 0.022;
        cc = mix3([0.82, 0.88, 1.0], col, 0.3 + 0.55 * t); inten = (0.32 + r() * 0.6) * (1.3 - t); sz = 0.024 + r() * 0.02;
      }
      if (r() < 0.028) { inten *= 4.5; sz *= 1.9; }
      put(gi, rho, th, h, cc[0] * inten, cc[1] * inten, cc[2] * inten, sz);
    }
    const core = mix3(col, [1, 1, 1], 0.55);
    put(gi, 0, 0, 0, core[0] * 3.2, core[1] * 3.2, core[2] * 3.2, 0.3);
    put(gi, 0, 0, 0, core[0] * 0.3, core[1] * 0.3, core[2] * 0.3, 1.7);
  }
  // Ring positions depend on the viewport: narrower screens pull the ring in.
  // `syp` (round 14): the heights on portrait screens, where the bodies sit
  // behind the list and the apex would otherwise land on the headline.
  const cache = { aspect: 0, c: new Float32Array(G * 3) };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  function centers(aspect) {
    if (cache.aspect === aspect) return cache.c;
    const rx = L.rx * Math.min(1, aspect / 1.6), ry = L.ry * (aspect < 1 ? 1.5 : 1), SY = aspect < 1 && L.syp ? L.syp : L.sy;
    for (let k = 0; k < G; k++) cache.c.set([rx * L.sx[k], ry * SY[k], L.sz[k]], k * 3);
    cache.aspect = aspect;
    return cache.c;
  }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  return { kind: 'galaxy', G, PER, pts, e1, e2, n: nn, sizes, dirs: L.dirs, centers, EDGES: L.edges, web: (aspect) => curveWeb(centers(aspect), L.edges, 0.12, 0.05) };
}
// Ring one, the products: a flattened heptagon since round 14 (seven apps), apex
// at the top for Chimera, the newest; the upper pair wide and nearer with their
// cards above, the side pair low with their cards beside, the lower pair pulled
// in and farther with their cards below. The headline keeps the middle: the apex
// galaxy is drawn at 0.85 so its glow stops above the dust at every desktop size,
// and on portrait screens it drops behind the list's first rows (`syp`). Before
// round 14 a flattened hexagon (side pair wide, upper and lower pairs pulled in).
const GAL = makeGalaxies({
  sx: [0, 0.97, 0.78, -0.78, -0.97, -0.45, 0.45], sy: [1, -0.2, 0.6, 0.6, -0.2, -0.95, -0.95], sz: [0.3, 0, -0.5, -0.5, 0, 0.5, 0.5], rx: 4.6, ry: 1.9,
  syp: [0.25, -0.2, 0.6, 0.6, -0.2, -0.95, -0.95], scales: [0.85, 1, 1, 1, 1, 1, 1],
  dirs: ['up', 'right', 'up', 'up', 'left', 'down', 'down'], edges: [[0, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1], [1, 0], [2, 6], [3, 5]],
}, 101);
// Ring two, the rest of the apps: a pentagon since round 11 (five apps), apex at
// the top, a little wider than ring one, the galaxies a size down.
const GAL2 = makeGalaxies({
  // ry 1.85 and the top galaxy at sz -0.35 (2.1 and -0.5 before round 12): the cards
  // grew a row of marks, and the top card, held at the 56px line, reached down into
  // its galaxy's glow at 1440 by 900
  sx: [0, 0.95, 0.59, -0.59, -0.95], sy: [1, 0.31, -0.81, -0.81, 0.31], sz: [-0.35, 0, 0.4, 0.4, 0], rx: 4.7, ry: 1.85, scale: 0.85,
  dirs: ['up', 'right', 'down', 'down', 'left'], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 4]],
}, 211);
// The Atlas's dotted web: each edge a quadratic curve of 70 points carrying a
// travelling pulse (x, y, z, u, phase, speed, base, size). `bulge` bends the
// curve; `base` is the resting brightness of its dots.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function curveWeb(c, EDGES, bulge, base) {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const out = [];
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  EDGES.forEach(([ia, ib], s) => {
    const A = [c[ia * 3], c[ia * 3 + 1], c[ia * 3 + 2]], B = [c[ib * 3], c[ib * 3 + 1], c[ib * 3 + 2]];
    const dir = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], len = Math.hypot(...dir);
    const off = norm(cross(dir, [0.1, 1, 0.1])).map((v) => v * len * bulge * (s % 2 ? 1 : -1));
    const ctrl = [(A[0] + B[0]) / 2 + off[0], (A[1] + B[1]) / 2 + off[1], (A[2] + B[2]) / 2 + off[2]];
    for (let i = 0; i < 70; i++) {
      const u = i / 69, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
      out.push(A[0] * w0 + ctrl[0] * w1 + B[0] * w2, A[1] * w0 + ctrl[1] * w1 + B[1] * w2, A[2] * w0 + ctrl[2] * w1 + B[2] * w2, u,
        (s * 0.137) % 1, 0.05 + (s % 3) * 0.02, base + 0.03 * Math.sin(u * 40 + s), 0.028);
    }
  });
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  return new Float32Array(out);
}
// The writing constellation. In the Atlas, Writing is the one elliptical galaxy,
// its works on a ring and a brighter knot for fiction. A scroll station has room
// for a figure instead: nine stars, the fiction asterism on the left in the
// Atlas's lilac, the letters on the right in the scene's blue, one line between
// them, joined by the same dotted web. Each star gets a card hung outward.
// A figure of stars: positions (x, y, z, card direction) at the station, the
// lines between them, one colour. Used by the writing constellation, the Medium
// arc and the changelog ladder.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function makeStars(DEF, EDGES, colour, base) {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const N = DEF.length, dirs = DEF.map((d) => d[3]);
  const colors = () => colour;
  const cache = { aspect: 0, c: new Float32Array(N * 3) };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  function centers(aspect) {
    if (cache.aspect === aspect) return cache.c;
    const sx = Math.min(1, aspect / 1.6), sy = aspect < 1 ? 1.5 : 1;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    DEF.forEach((d, k) => cache.c.set([d[0] * sx, d[1] * sy, d[2]], k * 3));
    cache.aspect = aspect;
    return cache.c;
  }
  // three points per star: a hot core, a glow, a wide halo (uKind 2)
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  function stars(aspect) {
    const c = centers(aspect), out = [];
    for (let k = 0; k < N; k++) {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
      const col = colors(k), core = mix3(col, [1, 1, 1], 0.6), x = c[k * 3], y = c[k * 3 + 1], z = c[k * 3 + 2];
      out.push(x, y, z, k, core[0] * 2.8, core[1] * 2.8, core[2] * 2.8, 0.07);
      out.push(x, y, z, k, col[0] * 0.7, col[1] * 0.7, col[2] * 0.7, 0.2);
      out.push(x, y, z, k, col[0] * 0.22, col[1] * 0.22, col[2] * 0.22, 0.6);
    }
    return new Float32Array(out);
  }
  // the figure's lines rest brighter than the galaxy web, so the figure reads
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  return { kind: 'stars', N, dirs, EDGES, colors, centers, stars, web: (aspect) => curveWeb(centers(aspect), EDGES, 0.05, base) };
}
// Writing: every story (sixteen since round 11) as a wreath of stars around the
// headline, in the Atlas's lilac (its Writing galaxy is elliptical with a lilac
// fiction knot): six across the top with their cards hung up, two down each side
// hung outward, six across the bottom hung down, in the site's order clockwise
// from the top left; one line runs the wreath. Rows 2.0 units up and down and
// sides 5.3 out keep sixteen 120px cards clear of each other and of the headline
// from 1024 by 768 up.
const CON = makeStars([
  [-5.5, 2.0, -0.2, 'up'], [-3.3, 2.0, -0.2, 'up'], [-1.1, 2.0, -0.2, 'up'], [1.1, 2.0, -0.2, 'up'], [3.3, 2.0, -0.2, 'up'], [5.5, 2.0, -0.2, 'up'],
  [5.3, 0.85, 0, 'right'], [5.3, -0.85, 0, 'right'],
  [5.5, -2.0, 0.2, 'down'], [3.3, -2.0, 0.2, 'down'], [1.1, -2.0, 0.2, 'down'], [-1.1, -2.0, 0.2, 'down'], [-3.3, -2.0, 0.2, 'down'], [-5.5, -2.0, 0.2, 'down'],
  [-5.3, -0.85, 0, 'left'], [-5.3, 0.85, 0, 'left'],
], Array.from({ length: 16 }, (_, i) => [i, (i + 1) % 16]), [0.78, 0.55, 0.86], 0.16);
// (The Newsletter's figure is the ringed planet and its moons, below.)
// Essays: a lintel above the headline, in rose. Two stars, one each side, joined
// by one line (round 12: the profile card at the apex went, so the figure is the
// pair rather than an arc with a gap); a third essay would take the apex again.
const ARC = makeStars([
  [-2.7, 2.0, 0, 'up'], [2.7, 2.0, 0, 'up'],
], [[0, 1]], [0.95, 0.62, 0.78], 0.18);
// Changelog: a ladder, two uprights either side of the headline with rungs across,
// newest at the top left and reading across and down; the pulses climb. Steel blue.
const LADDER = makeStars([
  // rungs 2.3 apart: closer and the cards touch on a 720px-high screen
  [-4.7, 2.3, 0, 'left'], [4.7, 2.3, 0, 'right'], [-4.7, 0, 0, 'left'], [4.7, 0, 0, 'right'], [-4.7, -2.3, 0, 'left'], [4.7, -2.3, 0, 'right'],
], [[0, 2], [2, 4], [1, 3], [3, 5], [0, 1], [2, 3], [4, 5]], [0.55, 0.80, 0.95], 0.16);
// Newsletter: Direction B inside the hybrid. The ringed planet sits where Orbit
// puts it (right of the copy on desktop, a limb at the bottom on phones) as a
// body at the station's depth, so it approaches like the galaxies. The six
// letters ride its ring as moons, the one at the front chosen by the orbit
// engine. Positions are set in screen terms at the hold (six units out, one
// unit of depth is 1.25 screen halves), so the moons sit on the shader's ring
// whatever the camera does.
const PLANET = {
  // desktop: the body sits to the right of the reading column (round 10 moved it
  // 0.15 right and shrinks it faster on narrow screens so the ring's left tip
  // clears the column); phones: a limb rising from the bottom
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  ndc(aspect) { return aspect < 1 ? [0, -1.32, 1.02] : [aspect - 0.45, -0.12, 0.5 * clamp(Math.pow(aspect / 1.6, 1.6), 0.55, 1)]; },
  // world position (x, y, z) and radius relative to the station, as seen from six units out
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  world(aspect) { const p = this.ndc(aspect), u = 6 / 1.25; return [p[0] * u, p[1] * u, 0, p[2] * u]; },
};
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function makeMoons(N) {
  const colour = [1.0, 0.82, 0.55];
  const colors = () => colour;
  const cache = { key: '', c: new Float32Array(N * 3), vis: new Float32Array(N) };
  const phi = () => (S.sp - NEWS) * ORBIT_DEG * DEG;   // the moons turn with the scroll, Orbit's 60 degrees a scene
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const key = (aspect) => `${aspect}|${phi().toFixed(4)}|${O.sp.toFixed(4)}`;
  // letter i sits ORB_STEP degrees further round the ring than letter i-1: the
  // newer ones to the right of the front, the older ones back to the left tip and
  // round the far side; the orbit position slides them all
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const angle = (i) => (ORB_FRONT + (O.sp - i) * ORB_STEP) * DEG + phi();
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  function centers(aspect) {
    const k = key(aspect);
    if (cache.key === k) return cache.c;
    const P = PLANET.world(aspect), A = P[3] * 1.75;
    for (let i = 0; i < N; i++) {
      const a = angle(i), x = P[0] + A * Math.cos(a), y = P[1] + A * 0.24 * Math.sin(a);
      cache.c.set([x, y, 0], i * 3);
      // the far half of the ring passes behind the body: a moon there hides inside the disc
      const r = Math.hypot(x - P[0], y - P[1]) / P[3];
      cache.vis[i] = Math.sin(a) > 0 ? smooth((r - 1.0) / 0.1) : 1;
    }
    cache.key = k;
    return cache.c;
  }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const vis = (i) => { centers(S.vw / S.vh); return cache.vis[i]; };
  // three points per moon as for the stars; the one at the front a touch brighter and larger
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  function stars(aspect) {
    const c = centers(aspect), out = [], core = mix3(colour, [1, 1, 1], 0.6);
    for (let k = 0; k < N; k++) {
      const lit = 1 - smooth(Math.abs(O.sp - k)), b = (0.78 + 0.22 * lit) * cache.vis[k], x = c[k * 3], y = c[k * 3 + 1], z = c[k * 3 + 2];
      out.push(x, y, z, k, core[0] * 2.8 * b, core[1] * 2.8 * b, core[2] * 2.8 * b, 0.06 + 0.025 * lit);
      out.push(x, y, z, k, colour[0] * 0.7 * b, colour[1] * 0.7 * b, colour[2] * 0.7 * b, 0.2);
      out.push(x, y, z, k, colour[0] * 0.22 * b, colour[1] * 0.22 * b, colour[2] * 0.22 * b, 0.55);
    }
    return new Float32Array(out);
  }
  // the web runs along the ring from the oldest letter to the newest, its pulses the weekly cadence
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const EDGES = []; for (let i = N - 1; i > 0; i--) EDGES.push([i, i - 1]);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const web = (aspect) => { const c = centers(aspect); return curveWeb(c, EDGES.filter(([a, b]) => cache.vis[a] > 0.5 && cache.vis[b] > 0.5), 0.02, 0.14); };
  return { kind: 'moons', N, dirs: Array.from({ length: N }, () => 'down'), EDGES, colors, centers, stars, web, key, vis };
}
const MOONS = makeMoons(ORB_N);
// The sets: one per scene with bodies and cards (found by id, never by position).
// `open` and `back` name a set the dive can enter and its detail's buttons; `go`
// marks a set whose items open where they live (the stories, round 13); the
// Newsletter has neither (its letters are read on the station). `layout: 'panel'`
// keeps the list in the panel (the letters are moons with tags, not hung cards).
const SETS = {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  projects:   { name: 'projects',   scene: sceneIndex('projects'),   items: PROJECTS,  body: GAL,    size: (k) => GAL.sizes[k] * 0.95,  hoop: (k) => GAL.sizes[k] * 1.7,  open: 'Open project', back: 'Back to the cluster' },
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  tools:      { name: 'tools',      scene: sceneIndex('tools'),      items: TOOLS,     body: GAL2,   size: (k) => GAL2.sizes[k] * 0.95, hoop: (k) => GAL2.sizes[k] * 1.7, open: 'Open project', back: 'Back to the cluster' },
  writing:    { name: 'writing',    scene: sceneIndex('writing'),    items: WRITING,   body: CON,    size: () => 0.3, hoop: () => 1.3, go: true },
  essays:     { name: 'essays',     scene: sceneIndex('essays'),     items: ESSAYS,    body: ARC,    size: () => 0.3, hoop: () => 1.3, open: 'Read on Medium', back: 'Back to the arc' },
  newsletter: { name: 'newsletter', scene: sceneIndex('newsletter'), items: LETTERS,   body: MOONS,  size: () => 0.3, hoop: () => 1.3, layout: 'panel' },
  changelog:  { name: 'changelog',  scene: sceneIndex('changelog'),  items: CHANGELOG, body: LADDER, size: () => 0.3, hoop: () => 1.3, open: 'Open the changelog', back: 'Back to the log' },
};
const SET_LIST = Object.values(SETS).filter((s) => s.scene >= 0);
const SET_BY_SCENE = Object.fromEntries(SET_LIST.map((s) => [s.scene, s]));

// ----------------------------------------------------------- 5. WebGL2 renderer
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function makeGL(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const program = (vs, fs) => {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  let P;
  try {
    P = { neb: program(VS_TRI, FS_NEB), comp: program(VS_TRI, FS_COMP), star: program(VS_STAR, FS_PT), dot: program(VS_DOT, FS_PT), gal: program(VS_GAL, FS_PT) };
  } catch (e) { console.error('scroll-scenes: shader build failed', e); return null; }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const shaderUse = (X) => { gl.useProgram(X.p); return X; };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const f1 = (X, n, v) => { const l = X.u[n]; if (l) gl.uniform1f(l, v); };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const i1 = (X, n, v) => { const l = X.u[n]; if (l) gl.uniform1i(l, v); };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const f2 = (X, n, a, b) => { const l = X.u[n]; if (l) gl.uniform2f(l, a, b); };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const f3 = (X, n, v) => { const l = X.u[n]; if (l) gl.uniform3f(l, v[0], v[1], v[2]); };
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const f3v = (X, n, v) => { const l = X.u[n]; if (l) gl.uniform3fv(l, v); };

  // galaxy and web geometry: 8 floats per point, two vec4 attributes
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const quadVao = (buf, data, usage) => {
    const v = gl.createVertexArray(); gl.bindVertexArray(v);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
    gl.bindVertexArray(null);
    return v;
  };
  // one GPU record per body set: static galaxy points; web and star buffers rebuilt
  // per aspect (and, for the moons, per orbit angle: 18 points, cheap)
  const gpu = new Map();
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const gpuFor = (B, aspect) => {
    let r = gpu.get(B);
    if (!r) {
      r = { key: null, webBuf: gl.createBuffer(), webN: 0, starBuf: gl.createBuffer(), starN: 0 };
      r.vaoWeb = quadVao(r.webBuf, new Float32Array(8), gl.DYNAMIC_DRAW);
      r.vaoStars = quadVao(r.starBuf, new Float32Array(8), gl.DYNAMIC_DRAW);
      if (B.kind === 'galaxy') r.vaoPts = quadVao(gl.createBuffer(), B.pts, gl.STATIC_DRAW);
      gpu.set(B, r);
    }
    const key = B.key ? B.key(aspect) : aspect;
    if (r.key !== key) {
      const w = B.web(aspect); r.webN = w.length / 8; r.key = key;
      gl.bindBuffer(gl.ARRAY_BUFFER, r.webBuf); gl.bufferData(gl.ARRAY_BUFFER, w, gl.DYNAMIC_DRAW);
      if (B.kind !== 'galaxy') { const s = B.stars(aspect); r.starN = s.length / 8; gl.bindBuffer(gl.ARRAY_BUFFER, r.starBuf); gl.bufferData(gl.ARRAY_BUFFER, s, gl.DYNAMIC_DRAW); }
    }
    return r;
  };

  const tri = gl.createVertexArray();
  gl.bindVertexArray(tri);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const starBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
  gl.bufferData(gl.ARRAY_BUFFER, stars, gl.STATIC_DRAW);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const starVao = (stride) => {
    const v = gl.createVertexArray(); gl.bindVertexArray(v);
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 16);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 32);
    return v;
  };
  const vaoPts = starVao(72), vaoLines = starVao(36);

  const dotPos = gl.createBuffer(), dotCol = gl.createBuffer();
  const vaoDots = gl.createVertexArray(); gl.bindVertexArray(vaoDots);
  gl.bindBuffer(gl.ARRAY_BUFFER, dotPos); gl.bufferData(gl.ARRAY_BUFFER, text.pos.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, dotCol); gl.bufferData(gl.ARRAY_BUFFER, text.col, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  let neb = null;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const freeNeb = () => { if (neb) { gl.deleteTexture(neb.tex); gl.deleteFramebuffer(neb.fb); neb = null; } };
  function resize() {
    canvas.width = Math.max(2, Math.round(S.vw * S.dpr));
    canvas.height = Math.max(2, Math.round(S.vh * S.dpr));
    freeNeb();
    const div = S.tier === 'high' ? 4 : 6;
    const w = Math.max(2, Math.floor(canvas.width / div)), h = Math.max(2, Math.floor(canvas.height / div));
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    neb = { tex, fb, w, h };
  }

  function frame() {
    const c = sceneParams();
    const focal = 1.25;
    // 1. nebula at low resolution
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    gl.bindFramebuffer(gl.FRAMEBUFFER, neb.fb);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    gl.viewport(0, 0, neb.w, neb.h);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    let X = shaderUse(P.neb);
    f1(X, 'uTime', S.time); f1(X, 'uScroll', S.sp); f1(X, 'uAngle', c.angle); f1(X, 'uMode', c.sky);
    f1(X, 'uAspect', c.aspect); f1(X, 'uExposure', c.exposure); i1(X, 'uOct', S.tier === 'high' ? 4 : 3);
    f3(X, 'uA', c.tint.a); f3(X, 'uB', c.tint.b);
    gl.bindVertexArray(tri); gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 2. composite
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    X = shaderUse(P.comp);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, neb.tex); i1(X, 'uNeb', 0);
    f1(X, 'uTime', S.time); f1(X, 'uAspect', c.aspect); f1(X, 'uMode', c.sky); f1(X, 'uGrain', 0.022); f1(X, 'uFlash', c.flash);
    f3(X, 'uPlanet', c.planet); f1(X, 'uPlanetA', c.planetA); f3(X, 'uLight', c.light); f3(X, 'uTint', c.tint.a); f2(X, 'uMouth', c.mouth[0], c.mouth[1]); f2(X, 'uMouthPos', c.mouthPos[0], c.mouthPos[1]);
    gl.bindVertexArray(tri); gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 3. stars, additive
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    X = shaderUse(P.star);
    f2(X, 'uCamXY', c.camXY[0], c.camXY[1]);
    f1(X, 'uMode', c.sky); f1(X, 'uCamZ', c.camZ); f1(X, 'uDepth', DEPTH); f1(X, 'uAngle', c.angle); f1(X, 'uTail', c.tail);
    f1(X, 'uFocal', focal); f1(X, 'uAspect', c.aspect); f1(X, 'uPx', S.dpr); f1(X, 'uTime', S.time); f1(X, 'uTwinkle', c.twinkle);
    f1(X, 'uLine', 0); gl.bindVertexArray(vaoPts); gl.drawArrays(gl.POINTS, 0, STAR_N);
    if (c.sky === 0 && Math.abs(c.tail) > 0.03) { f1(X, 'uLine', 1); gl.bindVertexArray(vaoLines); gl.drawArrays(gl.LINES, 0, STAR_N * 2); }
    // 4. the bodies of the hybrid: two rings of Atlas galaxies, the star figures
    // and the newsletter's moons, each with its dotted web
    if (c.mode === 3) {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
      X = shaderUse(P.gal);
      f1(X, 'uCamZ', c.camZ); f1(X, 'uDepth', DEPTH); f1(X, 'uFocal', focal); f1(X, 'uAspect', c.aspect); f1(X, 'uPx', S.dpr);
      f1(X, 'uPxScale', focal * canvas.height / 2); f1(X, 'uClock', c.galClock);
      for (const set of SET_LIST) {
        const B = set.body, z = c.zOf(set.scene), rel = z - c.camZ;
        if (rel < -2 || rel > DEPTH + 2) continue;   // behind the camera, or beyond the star box
        const r = gpuFor(B, c.aspect);
        // the moons hold still with their planet while the sky takes the orbit's swing
        f2(X, 'uCamXY', c.camXY[0] - (B.kind === 'moons' ? c.swing : 0), c.camXY[1]);
        f1(X, 'uGalZ', z); f1(X, 'uAlpha', c.alphaOf(set.scene) * (B.kind === 'moons' ? c.moonsA : 1));
        f1(X, 'uKind', 1); gl.bindVertexArray(r.vaoWeb); gl.drawArrays(gl.POINTS, 0, r.webN);
        if (B.kind === 'galaxy') {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
          f3v(X, 'uGC[0]', B.centers(c.aspect)); f3v(X, 'uGE1[0]', B.e1); f3v(X, 'uGE2[0]', B.e2); f3v(X, 'uGN[0]', B.n);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
          f1(X, 'uKind', 0); gl.bindVertexArray(r.vaoPts); gl.drawArrays(gl.POINTS, 0, B.G * B.PER);
        } else {
          f1(X, 'uKind', 2); gl.bindVertexArray(r.vaoStars); gl.drawArrays(gl.POINTS, 0, r.starN);
        }
      }
    }
    // 5. particle headlines
    if ((c.mode === 2 || c.mode === 3) && !S.rm) {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
      X = shaderUse(P.dot);
      f2(X, 'uRes', S.vw, S.vh); f1(X, 'uPx', S.dpr); f1(X, 'uLine', 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, dotPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, text.pos);
      gl.bindVertexArray(vaoDots); gl.drawArrays(gl.POINTS, 0, text.count);
    }
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }
  return { kind: 'webgl2', resize, frame, gl };
}

// ---------------------------------------------------------- 6. Canvas2D renderer
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function makeC2D(canvas) {
  const cx = canvas.getContext('2d');
  if (!cx) return null;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const css = (c, a) => `rgba(${(c[0] * 255) | 0},${(c[1] * 255) | 0},${(c[2] * 255) | 0},${a})`;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  function blob(x, y, r, c, a) {
    const g = cx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, css(c, a)); g.addColorStop(1, css(c, 0));
    cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function resize() { canvas.width = Math.round(S.vw * S.dpr); canvas.height = Math.round(S.vh * S.dpr); }
  function frame() {
    const c = sceneParams(), w = S.vw, h = S.vh, cxm = w / 2, cym = h / 2, half = h / 2;
    cx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    cx.fillStyle = '#0b0c14'; cx.fillRect(0, 0, w, h);
    const drift = c.sky === 1 ? c.angle * 0.4 : S.sp * 0.5;
    blob(cxm + Math.cos(drift) * w * 0.3, cym + Math.sin(drift * 0.7) * h * 0.25, Math.max(w, h) * 0.55, c.tint.a, 0.13 * c.exposure);
    blob(cxm - Math.cos(drift * 1.3) * w * 0.25, cym - Math.sin(drift) * h * 0.3, Math.max(w, h) * 0.45, c.tint.b, 0.1 * c.exposure);
    // the ringed body: Orbit's whole flight, and the hybrid's Newsletter station (a still planet, faded in)
    if (c.planetA > 0.01) {
      const A = c.planetA, px = cxm + c.planet[0] * half, py = cym - c.planet[1] * half, pr = c.planet[2] * half;
      const L = c.light, lx = px + L[0] * pr * 0.6, ly = py - L[1] * pr * 0.6;
      cx.save(); cx.beginPath(); cx.ellipse(px, py, pr * 2.2, pr * 2.2 * 0.26, 0, Math.PI, Math.PI * 2); cx.strokeStyle = `rgba(255,184,107,${0.55 * A})`; cx.lineWidth = 3; cx.stroke(); cx.restore();
      const g = cx.createRadialGradient(lx, ly, pr * 0.1, px, py, pr);
      const lit = L[2] < 0 ? 0.25 : 0.7;
      g.addColorStop(0, css(mix3([0.4, 0.45, 0.6], c.tint.a, 0.55), lit * A)); g.addColorStop(1, `rgba(6,7,12,${A})`);
      cx.fillStyle = g; cx.beginPath(); cx.arc(px, py, pr, 0, Math.PI * 2); cx.fill();
      cx.strokeStyle = css(c.tint.a, 0.5 * A); cx.lineWidth = 2; cx.stroke();
      cx.beginPath(); cx.ellipse(px, py, pr * 2.2, pr * 2.2 * 0.26, 0, 0, Math.PI); cx.strokeStyle = `rgba(255,184,107,${0.8 * A})`; cx.lineWidth = 3; cx.stroke();
    }
    // stars, same records as the WebGL path
    cx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < STAR_N; i++) {
      const o = i * 18, x = stars[o], y = stars[o + 1], z = stars[o + 2], size = stars[o + 3];
      let sx, sy, sz, fade;
      if (c.sky === 0) {
        const rel = ((z - c.camZ) % DEPTH + DEPTH) % DEPTH, rel2 = Math.max(rel, 0.15);
        const rx = x - c.camXY[0], ry = y - c.camXY[1];
        sx = cxm + rx / rel2 * 1.25 * half; sy = cym - ry / rel2 * 1.25 * half;
        fade = smooth(rel / 1.5) * (1 - smooth((rel - DEPTH * 0.55) / (DEPTH * 0.45)));
        sz = clamp(size * 1.25 * 2.2 / rel2, 1.2, 14) * 0.5;
        if (Math.abs(c.tail) > 0.03) {
          const r3 = Math.max(rel + c.tail * (0.35 + rel / DEPTH), 0.15);
          cx.strokeStyle = `rgba(${stars[o + 4] * 255 | 0},${stars[o + 5] * 255 | 0},${stars[o + 6] * 255 | 0},${fade * 0.35})`;
          cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(cxm + rx / r3 * 1.25 * half, cym - ry / r3 * 1.25 * half); cx.stroke();
        }
      } else {
        const depth = 0.25 + 0.75 * z / DEPTH;
        const xs = ((x / 7 * 2.6 + c.angle * depth * 0.9 + 2.6) % 5.2 + 5.2) % 5.2 - 2.6;
        sx = cxm + xs * half; sy = cym - y / 7 * 1.15 * half;
        fade = mix(0.35, 1, depth); sz = clamp(size * mix(0.6, 1.4, depth), 1, 6) * 0.5;
      }
      if (fade <= 0.01 || sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;
      cx.fillStyle = `rgba(${stars[o + 4] * 255 | 0},${stars[o + 5] * 255 | 0},${stars[o + 6] * 255 | 0},${fade})`;
      cx.beginPath(); cx.arc(sx, sy, sz, 0, Math.PI * 2); cx.fill();
    }
    if (c.sky === 0 && c.mouth[1] > 0) {
      cx.strokeStyle = `rgba(115,242,230,${c.mouth[1] * 0.55})`; cx.lineWidth = 2 + Math.min(c.mouth[0], 1) * 3;
      cx.beginPath(); cx.arc(cxm + c.mouthPos[0] * half, cym - c.mouthPos[1] * half, c.mouth[0] * half, 0, Math.PI * 2); cx.stroke();
    }
    if (c.mode === 3) {
      // the bodies, projected in JS: webs as plain lines, galaxies as points with a
      // soft core, stars as glows with a hot centre
      let camX = c.camXY[0];   // per set: the moons hold still with their planet while the sky takes the orbit's swing
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
      const proj = (x, y, rel) => [cxm + (x - camX) / rel * 1.25 * half, cym - (y - c.camXY[1]) / rel * 1.25 * half];
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
      const bodyFade = (rel, alpha) => smooth((rel - 0.3) / 1.3) * (1 - smooth((rel - DEPTH * 0.3) / (DEPTH * 0.2))) * alpha;
      // a web line fades with its depth as the bodies do, and thins with distance
      // as the shader's dots do (round 11: the lines once held full alpha at any
      // distance, so a far ladder drew a faint rectangle at the Newsletter hold)
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
      const edges = (cc, EDGES, z, alpha) => {
        cx.lineWidth = 1;
        for (const [ia, ib] of EDGES) {
          const ra = cc[ia * 3 + 2] + z - c.camZ, rb = cc[ib * 3 + 2] + z - c.camZ;
          if (ra < 0.5 || rb < 0.5 || ra > DEPTH * 0.5) continue;
          const a = alpha * bodyFade(Math.max(ra, rb), 1) * Math.min(1, 6 / Math.max(ra, rb));
          if (a < 0.01) continue;
          cx.strokeStyle = `rgba(140,178,255,${a.toFixed(3)})`;
          const A = proj(cc[ia * 3], cc[ia * 3 + 1], ra), B = proj(cc[ib * 3], cc[ib * 3 + 1], rb);
          cx.beginPath(); cx.moveTo(A[0], A[1]); cx.lineTo(B[0], B[1]); cx.stroke();
        }
      };
      for (const set of SET_LIST) {
        const B = set.body, z = c.zOf(set.scene), alpha = c.alphaOf(set.scene) * (B.kind === 'moons' ? c.moonsA : 1), g = B.centers(c.aspect);
        if (z - c.camZ < -2 || z - c.camZ > DEPTH * 0.5 + 2) continue;
        camX = c.camXY[0] - (B.kind === 'moons' ? c.swing : 0);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
        edges(g, B.kind === 'moons' ? B.EDGES.filter(([a, b]) => B.vis(a) > 0.5 && B.vis(b) > 0.5) : B.EDGES, z, (B.kind === 'galaxy' ? 0.18 : 0.14) * alpha);
        if (B.kind !== 'galaxy') {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
          for (let k = 0; k < B.N; k++) {
            const rel = g[k * 3 + 2] + z - c.camZ;
            if (rel < 0.5 || rel > DEPTH * 0.5) continue;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
            const fade = bodyFade(rel, alpha) * (B.vis ? B.vis(k) : 1), p = proj(g[k * 3], g[k * 3 + 1], rel), col = B.colors(k), r = Math.min(0.4 * 1.25 * half / rel, 110);
            if (fade <= 0.01) continue;
            const gr = cx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
            gr.addColorStop(0, css(mix3(col, [1, 1, 1], 0.6), fade)); gr.addColorStop(0.1, css(col, fade * 0.3)); gr.addColorStop(1, css(col, 0));
            cx.fillStyle = gr; cx.beginPath(); cx.arc(p[0], p[1], r, 0, Math.PI * 2); cx.fill();
          }
          continue;
        }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
        for (let k = 0; k < B.G; k++) {
          const rel = g[k * 3 + 2] + z - c.camZ;
          if (rel < 0.5 || rel > DEPTH * 0.5) continue;
          const fade = bodyFade(rel, alpha);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
          const e1x = B.e1[k * 3], e1y = B.e1[k * 3 + 1], e2x = B.e2[k * 3], e2y = B.e2[k * 3 + 1];
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
          for (let i = 0; i < B.PER; i++) {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
            const o = (k * B.PER + i) * 8, rho = B.pts[o + 1], th = B.pts[o + 2] + c.galClock * 0.05 / Math.max(rho + 0.15, 0.2);
            const x = g[k * 3] + (Math.cos(th) * e1x + Math.sin(th) * e2x) * rho, y = g[k * 3 + 1] + (Math.cos(th) * e1y + Math.sin(th) * e2y) * rho;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
            const p = proj(x, y, rel), r = Math.max(0.6, B.pts[o + 7] * 1.25 * half / rel * 0.5);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
            const col = `${Math.min(255, B.pts[o + 4] * 200) | 0},${Math.min(255, B.pts[o + 5] * 200) | 0},${Math.min(255, B.pts[o + 6] * 200) | 0}`;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
            if (i >= B.PER - 2) {
              // the soft core: a glow, not a disc
              const gr = cx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 2);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
              gr.addColorStop(0, `rgba(${col},${fade * (i === B.PER - 2 ? 0.9 : 0.12)})`); gr.addColorStop(1, `rgba(${col},0)`);
              cx.fillStyle = gr; cx.fillRect(p[0] - r * 2, p[1] - r * 2, r * 4, r * 4);
              continue;
            }
            cx.fillStyle = `rgba(${col},${fade * 0.8})`;
            cx.beginPath(); cx.arc(p[0], p[1], r, 0, Math.PI * 2); cx.fill();
          }
        }
      }
    }
    if ((c.mode === 2 || c.mode === 3) && !S.rm) {
      for (let i = 0; i < text.count; i++) {
        const o = i * 4, b = text.pos[o + 2];
        if (b <= 0.02) continue;
        cx.fillStyle = `rgba(${text.col[i * 3] * 255 | 0},${text.col[i * 3 + 1] * 255 | 0},${text.col[i * 3 + 2] * 255 | 0},${b})`;
        cx.fillRect(text.pos[o] - 1, text.pos[o + 1] - 1, text.pos[o + 3] * 0.8, text.pos[o + 3] * 0.8);
      }
    }
    cx.globalCompositeOperation = 'source-over';
    const vg = cx.createRadialGradient(cxm, cym, Math.min(w, h) * 0.35, cxm, cym, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    cx.fillStyle = vg; cx.fillRect(0, 0, w, h);
    if (c.flash > 0.01) { cx.fillStyle = `rgba(184,219,255,${Math.min(1, c.flash)})`; cx.fillRect(0, 0, w, h); }
  }
  return { kind: 'canvas2d', resize, frame };
}

// ------------------------------------------------------- 7. particle headlines
// Each scene's headline is rasterised once; particles flow between the shapes.
const text = (() => {
  const MAX = S.tier === 'high' ? 16000 : 6000;
  const pos = new Float32Array(MAX * 4);           // x, y, brightness, size
  const col = new Float32Array(MAX * 3);
  const seed = new Float32Array(MAX * 3);          // dissolve direction and phase
  const size0 = new Float32Array(MAX);             // resting particle size
  const targets = SCENES.map(() => new Float32Array(MAX * 2));
  const solid = SCENES.map(() => 0);               // particles that draw letters
  const PAL = [[0.39, 0.24, 0.78], [0.24, 0.39, 0.86], [0.55, 0.31, 0.82], [0.78, 0.43, 0.63], [0.27, 0.55, 0.78], [0.47, 0.24, 0.55], [0.31, 0.71, 0.86], [0.78, 0.55, 0.86]];
  const r = rng(11);
  for (let i = 0; i < MAX; i++) {
    const c = PAL[i % PAL.length], lift = 0.55;
    col[i * 3] = mix(c[0], 1, lift); col[i * 3 + 1] = mix(c[1], 1, lift); col[i * 3 + 2] = mix(c[2], 1, lift);
    const a = r() * Math.PI * 2;
    seed[i * 3] = Math.cos(a); seed[i * 3 + 1] = Math.sin(a); seed[i * 3 + 2] = r();
    size0[i] = 2.4 + r() * 1.6; pos[i * 4 + 3] = size0[i];
    pos[i * 4] = r() * innerWidth; pos[i * 4 + 1] = r() * innerHeight;
  }
  const rc = document.createElement('canvas'), rx = rc.getContext('2d', { willReadFrequently: true });
  const SC = 0.5;                                   // raster scale: one sample per 3 css px
  const STEP = 0.75;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  function rasterize(el, pin, out) {
    const keep = pin.style.transform, keepV = pin.style.visibility;
    pin.style.transform = 'none'; pin.style.visibility = 'hidden';
    const rect = el.getBoundingClientRect(), cs = getComputedStyle(el);
    pin.style.transform = keep; pin.style.visibility = keepV;
    const fs = parseFloat(cs.fontSize) * SC;
    const lh = (cs.lineHeight === 'normal' ? parseFloat(cs.fontSize) * 1.15 : parseFloat(cs.lineHeight)) * SC;
    rc.width = Math.max(2, Math.ceil(rect.width * SC)); rc.height = Math.max(2, Math.ceil(rect.height * SC + lh));
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    rx.clearRect(0, 0, rc.width, rc.height);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    if ('letterSpacing' in rx) rx.letterSpacing = (parseFloat(cs.letterSpacing) || 0) * SC + 'px';
    // the dust follows the DOM's alignment (the Newsletter station's copy sits left, on the dark side)
    const left = /^(left|start)$/.test(cs.textAlign);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    rx.fillStyle = '#fff'; rx.textAlign = left ? 'left' : 'center'; rx.textBaseline = 'alphabetic';
    // Wrap and draw with the DOM's weight so the particles and the solid text line up.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    rx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const words = el.textContent.trim().split(/\s+/), lines = []; let line = '';
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (rx.measureText(t).width > rc.width && line) { lines.push(line); line = wd; } else line = t; }
    if (line) lines.push(line);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    rx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;   // same weight as the DOM text that fades in over it
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    lines.forEach((ln, i) => rx.fillText(ln, left ? 0 : rc.width / 2, (i + 0.78) * lh));
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    const img = rx.getImageData(0, 0, rc.width, rc.height).data, pts = [];
    for (let y = 1; y < rc.height; y += STEP) for (let x = 1; x < rc.width; x += STEP) {
      const xi = Math.floor(x), yi = Math.floor(y);
      if (img[(yi * rc.width + xi) * 4 + 3] > 110) pts.push(rect.left + x / SC, rect.top + y / SC);
    }
    const n = pts.length / 2, take = Math.min(n, MAX), stride = n / Math.max(take, 1);
    for (let i = 0; i < take; i++) { const k = Math.floor(i * stride) * 2; out[i * 2] = pts[k]; out[i * 2 + 1] = pts[k + 1]; }
    // the rest is dust around the headline
    const d = rng(3 + lines.length);
    for (let i = take; i < MAX; i++) { out[i * 2] = rect.left + rect.width / 2 + (d() - 0.5) * rect.width * 1.6; out[i * 2 + 1] = rect.top + rect.height / 2 + (d() - 0.5) * S.vh * 0.9; }
    return take;
  }
  // what each scene's targets were rasterized from, so a check can read what the
  // dust actually draws rather than what the DOM says it should
  const rasterText = SCENES.map(() => '');
  function rebuild() { for (let i = 0; i < N; i++) { solid[i] = rasterize(pins[i].__head, pins[i], targets[i]); rasterText[i] = pins[i].__head.textContent.trim(); } }
  // Hybrid: the pool draws one headline at a time, posed by Descent's camera
  // (small and far ahead, then reading size, then past you). Particles change
  // owner while nothing is visible, so the swap never shows. The rest of the
  // pool is the home nebula's dust: drifting, and streaming past at speed.
  const owner = new Int8Array(MAX).fill(-1);
  let ownerIdx = -1;   // the scene whose headline the pool is drawing (for checks)
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  function updateHybrid(dt) {
    const a = clamp(Math.floor(S.sp), 0, N - 1), b = Math.min(a + 1, N - 1);
    const o = S.sp - a < 0.4 ? a : b;
    ownerIdx = o;
    // the Newsletter headline swings in as Orbit's panels do; every other one is posed by Descent
    const P = (o === NEWS ? POSE.orbitDust : POSE.descent)(S.sp - o), T = targets[o], ns = solid[o];
    const ox = P.x * S.vw / 100, oy = P.y * S.vh / 100;
    // a dive blows the headline outward and streams the dust past, like a fast scroll
    const dive = DIVE.active && !diveCalm() ? smooth(DIVE.t / 0.45) : 0;
    const cx = S.vw / 2, cy = S.vh / 2, vel = S.vel + 3 * dive * (1 - smooth((DIVE.t - 0.8) / 0.2)), t = S.time;
    const fin = S.fin * (1 - dive), k = S.still ? 1 : 1 - Math.exp(-dt * 10), scatter = (2 + 14 * (1 - P.o)) * (1 - 0.85 * fin);
    for (let i = 0; i < MAX; i++) {
      const q = i * 4, s = i * 3, snap = owner[i] !== o;
      owner[i] = o;
      if (i < ns) {
        let tx = cx + (T[i * 2] - cx) * P.s + ox, ty = cy + (T[i * 2 + 1] - cy) * P.s + oy;
        tx += (tx - cx) * (vel * 0.06 + dive * 1.8) + seed[s] * scatter + Math.sin(t * 1.7 + seed[s + 2] * 9) * 0.8 * (1 - fin);
        ty += (ty - cy) * (vel * 0.06 + dive * 1.8) + seed[s + 1] * scatter;
        if (snap) { pos[q] = tx; pos[q + 1] = ty; } else { pos[q] += (tx - pos[q]) * k; pos[q + 1] += (ty - pos[q + 1]) * k; }
        pos[q + 2] = P.o * (0.95 + 0.05 * fin) * (1 - dive); pos[q + 3] = size0[i] * (1 + 1.1 * fin);
      } else {
        pos[q] += (seed[s] * 12 + (pos[q] - cx) * vel * 0.9) * dt;
        pos[q + 1] += (seed[s + 1] * 12 + (pos[q + 1] - cy) * vel * 0.9) * dt;
        if (pos[q] < -40 || pos[q] > S.vw + 40 || pos[q + 1] < -40 || pos[q + 1] > S.vh + 40) {
          const r = (0.05 + seed[s + 2] * 0.3) * S.vh, ang = t * 0.37 + i;
          pos[q] = cx + Math.cos(ang) * r; pos[q + 1] = cy + Math.sin(ang) * r;
        }
        pos[q + 2] = 0.16 + 0.08 * Math.sin(t * 0.9 + seed[s + 2] * 20);
      }
    }
  }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  function update(dt) {
    if (S.dir === 'hybrid') return updateHybrid(dt);
    const a = clamp(Math.floor(S.sp), 0, N - 1), b = Math.min(a + 1, N - 1);
    const m = clamp01((S.sp - a - 0.1) / 0.75), dis = Math.sin(m * Math.PI);
    ownerIdx = m < 0.5 ? a : b;
    const TA = targets[a], TB = targets[b], k = S.still ? 1 : 1 - Math.exp(-dt * 9);
    const amp = (60 + S.vh * 0.12) * dis, t = S.time;
    for (let i = 0; i < MAX; i++) {
      const o = i * 4, s = i * 3;
      const isText = m < 0.5 ? i < solid[a] : i < solid[b];
      let tx = mix(TA[i * 2], TB[i * 2], m), ty = mix(TA[i * 2 + 1], TB[i * 2 + 1], m);
      const wob = Math.sin(t * 1.7 + seed[s + 2] * 9) * 0.8;
      const wf = 1 - 0.85 * S.fin;
      tx += seed[s] * amp * (0.5 + seed[s + 2]) + wob * wf; ty += seed[s + 1] * amp * (0.5 + seed[s + 2]) + wob * wf;
      pos[o] += (tx - pos[o]) * k; pos[o + 1] += (ty - pos[o + 1]) * k;
      pos[o + 2] = (isText ? 0.9 + 0.1 * S.fin : 0.22) * (1 - dis * 0.35) + dis * 0.25;
      pos[o + 3] = isText ? size0[i] * (1 + 1.1 * S.fin) : size0[i];
    }
  }
  // the headline the dust is drawing right now (the text its targets were built
  // from), or null when the dust is off
  const headline = () => (usesDust() && !S.rm && ownerIdx >= 0 ? rasterText[ownerIdx] : null);
  // the box of the lit letter particles on screen, for checks
  function box() {
    if (!usesDust() || S.rm || ownerIdx < 0) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
    for (let i = 0; i < solid[ownerIdx]; i++) {
      const q = i * 4; if (pos[q + 2] < 0.5) continue;
      n++; x0 = Math.min(x0, pos[q]); y0 = Math.min(y0, pos[q + 1]); x1 = Math.max(x1, pos[q]); y1 = Math.max(y1, pos[q + 1]);
    }
    return n ? { owner: ownerIdx, n, left: x0, top: y0, right: x1, bottom: y1 } : { owner: ownerIdx, n: 0 };
  }
  return { pos, col, count: MAX, rebuild, update, headline, box };
})();

// ----------------------------------------------------------- 8. controls, boot
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
let renderer = null, canvas = $('#sky');
function bootRenderer() {
  if (q.get('nogl') !== '1') {
    renderer = makeGL(canvas);
    if (renderer) input.listen(canvas, 'webglcontextlost', (e) => { e.preventDefault(); fallback('WebGL context lost; drawing with Canvas2D.'); }, { once: true });
  }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (!renderer) fallback('WebGL2 is not available; drawing with Canvas2D.');
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  S.renderer = renderer.kind;
  note();
}
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function fallback(msg) {
  const fresh = canvas.cloneNode(false);
  canvas.replaceWith(fresh); canvas = fresh;
  renderer = makeC2D(canvas);
  S.renderer = 'canvas2d';
  const f = $('#fallback'); f.hidden = false; f.textContent = msg;
  layout(); note();
}
function note() { const n = $('#note'); if (n) n.textContent = `${S.renderer} · ${S.tier} · ${S.rm ? 'calm motion' : 'full motion'} · scroll, or use the scene list`; }

function layout() {
  S.vw = innerWidth; S.vh = innerHeight;
  html.style.setProperty('--vh', S.vh + 'px');
  // the bottom of the screen belongs to the legend: cards, tags and the reader stop
  // above it (the legend wraps on phones, so where it starts is measured)
  S.bottom = nav ? Math.ceil(S.vh - nav.getBoundingClientRect().top) + 8 : 36;
  html.style.setProperty('--hud-bottom', S.bottom + 'px');
  S.dpr = Math.min(devicePixelRatio || 1, S.tier === 'high' ? 2 : 1.5);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  renderer.resize();
  if (usesDust()) text.rebuild();
  readScroll();
}
const usesDust = () => true;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function setDir(_d) { /* hybrid is the only direction */ }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function setCalm(on) {
  S.rm = on; html.classList.toggle('calm', on);

  note();
}

// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function frame(now) {
  // frozen (checks): no time passes, so the free dust holds and two captures of
  // one snap are the same picture
  const t = now / 1000, dt = S.frozen ? 0 : Math.min(0.05, t - (S.last || t)); S.last = t;
  S.time = S.still ? S.stillT : S.time + dt;
  step(dt);
  stepOrbit(dt);
  stepDive(dt);
  applyPoses();
  stepReader(dt);
  if (usesDust() && !S.rm) text.update(dt);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  renderer.frame();
  S.frames++;
  raf = requestAnimationFrame(frame);
}

bootRenderer();
html.dataset.dir = S.dir;
html.classList.toggle('calm', S.rm);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
input.listen(mq, 'change', (e) => setCalm(e.matches));
navLinks.forEach((a, i) => input.listen(a, 'click', (e) => { e.preventDefault(); if (DIVE.active) return; scrollTo({ top: i * PITCH * S.vh, behavior: S.rm ? 'auto' : 'smooth' }); }));
input.listen(window, 'scroll', readScroll, { passive: true });
input.listen(window, 'resize', layout);

// What a click does: cards (click, tap, Enter) and bodies (hit test on the sky)
// activate their item; for a dive, Escape and clicks skip or close, Back reverses.
// cards carry data-set="projects|tools|writing|essays|newsletter|changelog" and data-k
$$('[data-set][data-k]').forEach((a) => input.listen(a, 'click', (e) => {
  // a story's card is a plain link to the story (round 13): the browser follows it,
  // so a modified click or a middle click still opens a new tab
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (SETS[a.dataset.set].go) { e.stopPropagation(); return; }
  e.preventDefault(); e.stopPropagation();
  if (DIVE.active) return;
  // a letter's chip turns the ring to it (its text is then on screen)
  if (a.dataset.set === 'newsletter') pickMoon(Number(a.dataset.k));
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  else activate(SETS[a.dataset.set], Number(a.dataset.k), a);
}));
// the galaxy or star under the pointer, when its station is the one on screen
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const bodyAt = (x, y) => {
  
  const c = sceneParams();
  for (const set of SET_LIST) {
    if (Math.abs(S.sp - set.scene) > 0.45) continue;
    for (let k = 0; k < set.items.length; k++) {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
      if (set.body.vis && set.body.vis(k) < 0.5) continue;   // a moon behind its planet
      const s = bodyScreen(set, k, c);
      if (s.fade > 0.3 && Math.hypot(x - s.x, y - s.y) < Math.max(s.radius * 1.1, 18)) return { set, k };
    }
  }
  return null;
};
// Moon tags (hybrid, Newsletter): one per letter, carrying its issue number, placed
// under its moon each frame. Pointer only; the list on the dark side is the keyboard path.
const tagWrap = document.createElement('div'); tagWrap.className = 'moon-tags'; tagWrap.setAttribute('aria-hidden', 'true'); tagWrap.hidden = true;
// a moon, its tag or its chip turns the ring to that letter; the one at the front
// does nothing more (round 13: its whole text is already on the station)
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
const pickMoon = (k) => { if (DIVE.active) return; orbitTo(k); };
const moonTags = LETTERS.map((p, k) => {
  const b = document.createElement('button'); b.type = 'button'; b.tabIndex = -1; b.className = 'moon-tag'; b.textContent = p.num;
  input.listen(b, 'click', (e) => { e.stopPropagation(); pickMoon(k); });
  tagWrap.appendChild(b); return b;
});
root.appendChild(tagWrap);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
input.listen(window, 'pointermove', (e) => { if (!DIVE.active) canvas.style.cursor = bodyAt(e.clientX, e.clientY) ? 'pointer' : ''; }, { passive: true });
input.listen(window, 'click', (e) => {
  if (DIVE.active) {
    if (DIVE.dir === 1) { skipDive(); return; }
    if (DIVE.dir === 0 && !detail.querySelector('.detail-card').contains(e.target)) closeDive();
    return;
  }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (e.target.closest('a, button, .inner, .controls, .hud')) return;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const hit = bodyAt(e.clientX, e.clientY);
  if (!hit) return;
  if (hit.set === SETS.newsletter) pickMoon(hit.k); else activate(hit.set, hit.k, null);
});
// The orbit's inputs. Each one acts only while the Newsletter station is on
// screen and no dive runs, and only on gestures that are clearly sideways, so
// vertical scrolling and the browser's own gestures keep their meaning.
const letterRows = $$('#newsletter .pieces li'); let frontRow = -1;
const orbitPos = $('#orbit-pos'), orbitBtns = $$('.orbit-btn');
// The reader: the letter at the front is read on screen. The article for the
// front letter is the one shown; as the ring turns the panel fades out, swaps at
// the halfway point and fades in again, and during a longer sweep it stays out
// until the ring is nearly at rest, so nothing flickers. Calm motion: the same
// fade out, swap, fade in, with no motion behind it. Once the ring has settled on
// a letter for 0.4 s, the live region names it to screen readers, once.
const readerEl = $('#newsletter .reader'), readerArts = $$('#newsletter .reader .issue'), announceEl = $('#orbit-announce');
const RD = { shown: -1, alpha: 1, announced: 0, named: -1, settle: 0, wheeled: 0, held: 0, passed: 0, lastWheel: -1e9 };
// Round 11: each article carries the whole letter, scrolling inside its body. A
// change of letter starts at the top of the text and keeps the keyboard focus in
// the panel if it was there; the masks at the top and bottom show where there is
// more to read, and go when there is not.
const readerBodies = readerArts.map((a) => $('.issue-body', a));
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function maskReader(body) {
  body.classList.toggle('at-top', body.scrollTop < 2);
  body.classList.toggle('at-end', body.scrollTop + body.clientHeight >= body.scrollHeight - 2);
}
readerBodies.forEach((b) => input.listen(b, 'scroll', () => maskReader(b), { passive: true }));
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function swapReader(k) {
  const focused = document.activeElement && document.activeElement.classList.contains('issue-body');
  readerArts.forEach((a, i) => { a.hidden = i !== k; });
  readerBodies.forEach((b) => { b.scrollTop = 0; });
  readerEl.setAttribute('aria-labelledby', `issue-${LETTERS[k].num}-title`);
  if (focused) readerBodies[k].focus({ preventScroll: true });
  maskReader(readerBodies[k]);
  RD.shown = k;
}
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
function stepReader(dt) {
  const want = orbFront();
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (RD.shown < 0) { swapReader(want); RD.named = want; if (q.has('rd')) { readerBodies[want].scrollTop = parseFloat(q.get('rd')) || 0; maskReader(readerBodies[want]); } }
  const dist = Math.abs(O.sp - Math.round(O.sp)), lag = Math.abs(O.sp - O.raw);
  const near = 1 - smooth((dist - 0.12) / 0.25), close = 1 - smooth((lag - 0.4) / 0.5);
  const target = S.rm ? 1 : near * close;
  if (S.still) { if (RD.shown !== want) swapReader(want); RD.alpha = target; }
  else if (RD.shown !== want) { RD.alpha = Math.max(0, RD.alpha - dt / 0.15); if (RD.alpha <= 0.001) swapReader(want); }
  else RD.alpha += (target - RD.alpha) * (1 - Math.exp(-dt / (target > RD.alpha ? 0.12 : 0.08)));
  readerEl.style.opacity = RD.alpha.toFixed(3);
  RD.settle = O.raw === Math.round(O.raw) && Math.abs(O.sp - O.raw) < 0.01 ? RD.settle + dt : 0;
  if (RD.settle > 0.4 && RD.named !== want && RD.shown === want) {
    const p = LETTERS[want];
    announceEl.textContent = `No. ${p.num}, ${p.title}, ${p.date}`;
    RD.named = want; RD.announced++;
  }
}
orbitBtns.forEach((b) => input.listen(b, 'click', (e) => { e.stopPropagation(); if (atOrbit()) orbitInput(Number(b.dataset.orb)); }));
input.listen(window, 'wheel', (e) => {
  if (!atOrbit()) return;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  let dx = e.deltaX, dy = e.deltaY;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (e.shiftKey && dx === 0 && dy !== 0) { dx = dy; dy = 0; }   // shift+wheel on a mouse reads as sideways
  if (Math.abs(dx) < 2 || Math.abs(dx) < Math.abs(dy) * 1.5) { O.ignored++; return; }   // vertical, or mixed: the page scrolls
  e.preventDefault();
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? S.vw : 1;
  orbitInput(-dx * unit / ORB_PX);   // fingers right (content right) bring the older letter on the left to the front
}, { passive: false });
// The reader's text (round 11): a vertical wheel over it scrolls the text while
// there is room that way. At either end the text keeps the wheel while the
// wheeling goes on, and the page takes it only after a pause of 350 ms with no
// wheel at all: a trackpad's momentum then ends on the last line instead of
// carrying the flight to the next station, and the reader moves on by stopping
// and scrolling again. Sideways input is the ring's (above).
input.listen(window, 'wheel', (e) => {
  if (e.defaultPrevented || DIVE.active || !atOrbit()) return;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const body = e.target && e.target.closest ? e.target.closest('.issue-body') : null;
  if (!body) return;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? S.vh : 1, dy = e.deltaY * unit;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (Math.abs(dy) < 1 || Math.abs(dy) < Math.abs(e.deltaX) * 1.5) return;
  const now = performance.now();
  const room = dy > 0 ? body.scrollHeight - body.clientHeight - body.scrollTop > 1 : body.scrollTop > 0;
  if (room) { body.scrollTop += dy; e.preventDefault(); RD.lastWheel = now; RD.wheeled++; }
  else if (now - RD.lastWheel < 350) { e.preventDefault(); RD.lastWheel = now; RD.held++; }
  else RD.passed++;
}, { passive: false });
input.listen(window, 'keydown', (e) => {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (e.key === 'Escape') {
    if (!DIVE.active) return;
    if (DIVE.dir === 1) skipDive(); else if (DIVE.dir === 0) closeDive();
    return;
  }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (!atOrbit() || e.altKey || e.ctrlKey || e.metaKey) return;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const t = e.target, typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
  if (typing) return;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); orbitInput(e.key === 'ArrowLeft' ? 1 : -1); }
});
// touch: the first clearly sideways move claims the gesture for the ring; a vertical one is the page's
const touch = { id: -1, x: 0, y: 0, last: 0, t: 0, vx: 0, claimed: false, lost: false };
input.listen(window, 'touchstart', (e) => {
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  if (!atOrbit() || e.touches.length !== 1 || e.target.closest('a, button, .controls, .hud')) { touch.id = -1; return; }
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const p = e.touches[0]; touch.id = p.identifier; touch.x = touch.last = p.clientX; touch.y = p.clientY; touch.t = performance.now(); touch.vx = 0; touch.claimed = false; touch.lost = false;
}, { passive: true });
input.listen(window, 'touchmove', (e) => {
  if (touch.id < 0 || touch.lost || !atOrbit()) return;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const p = Array.from(e.touches).find((x) => x.identifier === touch.id); if (!p) return;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const dx = p.clientX - touch.x, dy = p.clientY - touch.y;
  if (!touch.claimed) {
    if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) { touch.lost = true; return; }   // vertical: the page scrolls
    if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    touch.claimed = true;
  }
  if (e.cancelable) e.preventDefault();
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  const now = performance.now(), step = p.clientX - touch.last;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  touch.vx = step / Math.max(now - touch.t, 1); touch.t = now; touch.last = p.clientX;
  orbitInput(step / (ORB_PX * 0.7));
}, { passive: false });
input.listen(window, 'touchend', () => {
  if (touch.id < 0) return;
  if (touch.claimed && Math.abs(touch.vx) > 0.4) orbitInput(Math.sign(touch.vx) * 0.6);   // a flick carries one letter further
  touch.id = -1;
}, { passive: true });
input.listen(window, 'touchcancel', () => { touch.id = -1; }, { passive: true });
input.listen($('#detail-back'), 'click', (e) => { e.stopPropagation(); closeDive(); });
const diveQ = /^([tmc]?)(\d+)$/.exec(q.get('dive') || '');
if (diveQ) {
  // captures: hold the dive at a progress (?dive=2 a project, t2 a tool, m0 an essay, c2 a log entry)
  const set = { '': SETS.projects, t: SETS.tools, m: SETS.essays, c: SETS.changelog }[diveQ[1]];
  DIVE.hold = true; DIVE.t = clamp(parseFloat(q.get('dt') || '0.5'), 0, 1);
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  startDive(set, clamp(parseInt(diveQ[2], 10) || 0, 0, set.items.length - 1), null);
  if (DIVE.t >= 1) { DIVE.dir = 0; DIVE.open = true; detail.classList.add('on'); }
}
// The dust headlines are rasterised from the headline face, so the first rasterise
// waits for it (asked for by name: document.fonts.ready alone can settle before the
// face is requested), capped at 2 s; a face that lands later rebuilds the headlines,
// as the prototype's fonts.ready did.
const headFace = Promise.all([document.fonts.load('500 60px "SS Montserrat"'), document.fonts.ready]).catch(() => undefined);
Promise.race([headFace, new Promise((resolve) => { fontTimer = window.setTimeout(resolve, 2000); })]).then(() => { if (!disposed) { text.rebuild(); layout(); raf = requestAnimationFrame(frame); } });
input.listen(document.fonts, 'loadingdone', () => { if (!disposed && S.frames > 0) text.rebuild(); });
readScroll();

// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
if (debug) window.__ss = {
  get dir() { return S.dir; }, get sp() { return S.sp; }, get vel() { return S.vel; }, get tier() { return S.tier; },
  get renderer() { return S.renderer; }, get frames() { return S.frames; }, get rm() { return S.rm; },
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  goto(p) { S.still = true; S.stillP = p; },
  release() { S.still = false; DIVE.hold = false; },
  setDir,
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  get diveState() { return { active: DIVE.active, set: DIVE.set ? DIVE.set.name : null, k: DIVE.k, t: DIVE.t, open: DIVE.open }; },
  get dust() { return text.headline(); },
  dustBox() { return text.box(); },
  // the Newsletter station's orbit, for checks: the planet's presence, the sun's
  // angle, which moons are in view, their tags on screen, and the ring's position
  get orbit() {
    const c = sceneParams(), shown = moonTags.filter((t) => t.style.visibility === 'visible'), front = orbFront();
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
    const inView = (t) => { const r = t.getBoundingClientRect(); return r.left >= 0 && r.right <= S.vw && r.top >= 0 && r.bottom <= S.vh; };
    return { planetA: c.planetA, moonsA: c.moonsA, theta: Math.round(c.theta / DEG), swing: c.swing, vis: LETTERS.map((_, k) => MOONS.vis(k)), tags: shown.length, tagsIn: shown.every(inView),
      n: ORB_N, o: O.sp, raw: O.raw, front, num: LETTERS[front].num, settled: O.raw === Math.round(O.raw) && Math.abs(O.sp - O.raw) < 0.01,
      frontVis: MOONS.vis(front), frontTag: moonTags[front].style.visibility === 'visible' && inView(moonTags[front]),
      row: letterRows.findIndex((li) => li.classList.contains('front')), pos: orbitPos.textContent, consumed: O.consumed, ignored: O.ignored,
      active: RD.shown, readerAlpha: RD.alpha, announced: RD.announced, announcement: announceEl.textContent,
      wheeled: RD.wheeled, held: RD.held, passed: RD.passed, scroll: RD.shown >= 0 ? readerBodies[RD.shown].scrollTop : 0 };
  },
  orbitTo,
  // what the sky draws for each set right now: its depth and alpha, and whether
  // the renderer draws it at all (a body behind the camera is culled)
  get bodies() {
    const c = sceneParams();
    // alpha as the shader has it: the set's alpha under the depth fade (in by rel
    // 1.6, out between rel 12 and 20); the moons carry their own near fade
    return SET_LIST.map((set) => {
      const rel = c.zOf(set.scene) - c.camZ, drawn = rel >= -2 && rel <= DEPTH + 2;
      const depth = set.body.kind === 'moons' ? c.moonsA : smooth((rel - 0.3) / 1.3) * (1 - smooth((rel - DEPTH * 0.3) / (DEPTH * 0.2)));
      return { set: set.name, scene: set.scene, rel: Number(rel.toFixed(2)), alpha: drawn ? Number((c.alphaOf(set.scene) * depth).toFixed(3)) : 0 };
    }).concat([{ set: 'planet', scene: NEWS, rel: Number((c.zOf(NEWS) - c.camZ).toFixed(2)), alpha: Number(c.planetA.toFixed(3)) }]);
  },
  // checks: show only station i (its pin and cards) and no body of a station
  // behind the camera; -1 restores. A frame in solo against a frame without it
  // differs only where something of another station was still being drawn.
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  solo(i) { S.solo = typeof i === 'number' && i >= 0 ? i : -1; },
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  freeze(on) { S.frozen = !!on; },
  version: VERSION,
  get scenes() { return SCENES.map((s) => ({ id: s.id, label: s.label })); },
  // what a click on the item does (a dive, or for a story the story's page)
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  dive(k, which) { activate(SETS[which || 'projects'], k, null); },
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  holdDive(t) { DIVE.hold = true; DIVE.t = clamp(t, 0, 1); },
  closeDive,
  // checks: where a set's body k is on screen right now
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  bodyPos(which, k) { const s = bodyScreen(SETS[which], k, sceneParams()); return { x: s.x, y: s.y, radius: s.radius, fade: s.fade }; },
  // checks: how many items each set holds, which sets have a detail card, and the
  // detail card's copy for one of their items (filled without a dive)
  get setSizes() { return Object.fromEntries(SET_LIST.map((s) => [s.name, s.items.length])); },
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  get detailSets() { return SET_LIST.filter((s) => s.open).map((s) => s.name); },
  // the card's words: its text less the marks' own titles (they are the marks' names, exempt as logos)
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  detailText(which, k) { if (DIVE.active || !SETS[which].open) return null; fillDetail(SETS[which], k); const w = document.createTreeWalker(detail, NodeFilter.SHOW_TEXT); let s = ''; for (let n = w.nextNode(); n; n = w.nextNode()) if (!n.parentElement.closest('svg.ti')) s += n.textContent + ' '; return s.replace(/\s+/g, ' ').trim(); },
  // the card's technologies for an item (checks): name, the mark it uses, and the visible word if any
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  detailTech(which, k) { if (DIVE.active || !SETS[which].open) return null; fillDetail(SETS[which], k); return $$('#detail-tech li').map((li) => ({ name: li.dataset.name, ref: li.querySelector('use').getAttribute('href'), shown: li.querySelector('span') ? li.querySelector('span').textContent : '' })); },
};

return { dispose() {
  disposed = true;
  window.cancelAnimationFrame(raf);
  window.clearTimeout(fontTimer);
  input.dispose();
  const gl = canvas.getContext('webgl2');
  const lose = gl && gl.getExtension('WEBGL_lose_context');
  if (lose) lose.loseContext();
  if (debug) console.info('scroll scenes dispose', { loseContext: !!lose });
  tagWrap.remove();
  html.classList.remove('ss-on', 'locked', 'calm');
  html.removeAttribute('data-dir');
  html.style.removeProperty('--vh');
  html.style.removeProperty('--hud-bottom');
  $('#scenes').inert = false;
// @ts-expect-error Prototype JavaScript uses dynamic DOM and renderer records.
  delete window.__ss;
} };
}
