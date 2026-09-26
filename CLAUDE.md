# CLAUDE.md

## Project Overview

Personal portfolio site for Nichalas Barnes. Built with Gatsby 5, TypeScript, React Three Fiber (R3F) particle system, GSAP page transitions, and a Gemini-backed AI terminal.

## Architecture

- **Layout wrapper**: `gatsby-plugin-transition-link` wraps all pages with `src/components/layout.tsx`, which renders the persistent particle background, header, sidebar, and custom cursor.
- **Particle system**: R3F Canvas in `ParticleBackground.tsx` renders instanced mesh particles driven by `useParticlePhysics.ts`. Supports page-specific themes (colors, drift, brightness) with lerp transitions.
- **Floating artifacts**: `DomArtifacts.tsx` manages two artifact types (icon glass squares + changelog cards) with a requestAnimationFrame physics loop (shooting/materializing/floating/dissolving phases). Home page only.
- **Terminal**: `TerminalConsole.tsx` renders on all pages. On home it auto-shows with cycling quotes; on other pages it starts collapsed. Free-form input hits `/.netlify/functions/chat` (Gemini Flash) with page context. Falls back to poetic `FALLBACK_RESPONSES`.
- **Page transitions**: GSAP `autoAlpha` animations keyed to `transitionStatus` prop from transition-link (`entering`/`exiting`). The home "Explore the Atlas" button instead runs the wormhole journey (see Cosmos stage).
- **Cosmos stage**: one persistent WebGL2 canvas (`CosmosStage.tsx`, mounted by the layout on every route) renders the Atlas on `/atlas` and the home-to-Atlas wormhole journey. Details below.
- **Changelog**: Markdown files in `content/changelog/` processed by `gatsby-transformer-remark`. Rendered on `/changelog` with type filtering and as floating cards on the home page.

## File Structure

```
src/
  components/
    nebula/          # Particle system, artifacts, terminal
    audio/           # Ambient audio engine, interaction sounds
    cosmos/          # Cosmos stage: WebGL2 engine (engine/), snapshot, store
    atlas/           # Atlas views (WebGL and classic), HUD, panels
    layout.tsx       # Root layout (particles, cursor, header, sidebar, terminal)
    header.tsx       # Logo + social links + hamburger
    SideBar.js       # Slide-out nav (react-spring)
    SideBarCollapsed.js  # Icon rail nav
  pages/             # Gatsby file-based routes
  styles/            # Global CSS
content/
  changelog/         # Markdown changelog entries
netlify/
  functions/         # Serverless (chat.ts for Gemini AI)
scripts/
  cosmos-capture.mjs # Headless Chrome harness for the cosmos stage
test/                # node --test suites (*.test.mjs, cosmos-*.test.ts)
```

## Commands

```bash
npx gatsby develop    # Dev server at localhost:8000
npx gatsby build      # Production build
npx gatsby clean      # Clear cache (required after adding plugins, and after CSS-only
                      # changes: a build can keep stale inlined CSS in page HTML)
npm test              # All tests (source checks + the cosmos lane)
npm run test:cosmos   # Pure cosmos engine tests (node --experimental-strip-types)
npm run type-check    # tsc --noEmit
node scripts/cosmos-capture.mjs --help   # Headless captures and checks
```

## Cosmos stage (Atlas and wormhole journey)

- **Engine**: raw WebGL2 (no three.js) in `src/components/cosmos/engine/`, ported from the approved prototype `docs/superpowers/specs/assets/2026-09-26-wormhole-study.html`. Pure modules (vec3, wormholeMath, orbitCamera, atlasScene, labels, picking, journeyTimeline) import each other with explicit `.ts` extensions so `npm run test:cosmos` can run them in Node.
- **Modes** (`stage.ts`, mirrored on `<html data-cosmos-mode>` and in `cosmosStore.ts`): `off` (other routes; GPU memory freed after 10s), `idle` (home; compiles and builds everything in idle time, canvas hidden), `journey` (canvas on top), `atlas` (canvas behind the Atlas HUD).
- **Journey**: the CTA in `src/pages/index.tsx` rasterizes the live page (`homeSnapshot.ts`, roots marked `data-cosmos-snapshot="<stacking order>"`; add the marker to any new always-visible home UI) and calls `startJourney`. At the hand-off the stage navigates to `/atlas/` with `viaJourney` state and reveals the HUD through `hudVisible`. Click, tap or Escape skips. Sound on adds the synthesized score (`journeyAudio.ts`). Reduced motion or no WebGL2 navigates directly.
- **Fallback**: the classic Canvas2D Atlas (`AtlasCanvas.tsx`) shows with `?atlas-legacy`, without WebGL2, and after a lost context (until the next visit).
- **Quality tiers** (`quality.ts`): `high` on desktops, `balanced` on phones and 4-core devices; the Atlas also adapts its resolution when the black hole fills the view.
- **Labels** are DOM nodes the stage positions each frame, steering around HUD elements marked `data-cosmos-avoid` (plus the project rail and header). Clicking a label, or the hover preview card, runs `stage.activate()`: the same action as clicking that object in the scene.
- **Debug hook**: add `?cosmos-debug` to expose `window.__cosmos` (`api`, `mode`, `tier`, `warm`, `frames`, `atlasScale`, `screenOf(kind, id)`, `goto(t)` to hold a running journey).
- **Harness**: `node scripts/cosmos-capture.mjs <scenario>` against `npx gatsby serve -p 9123 -H 127.0.0.1` (scenarios: atlas, atlas-enter, closeup, perf, clicks, context-loss, journey, longtasks, audio). Headless Chrome drops the page to the video frame rate once 2+ videos play, so `perf` blocks videos.

## Environment Variables

- `GEMINI_API_KEY` -- Google Gemini API key for terminal AI chat (in `.env`)

## Coding Conventions

- No em-dashes in any text content
- Dark theme throughout (near-black backgrounds, white/muted text)
- Fonts: Montserrat (headings/titles), Courier New/monospace (code/terminal), system sans-serif (body)
- Responsive breakpoints: 768px (tablet), 550px (mobile)
- Page-specific particle themes defined in `src/components/nebula/particleThemes.ts`
- Audio defaults to muted; respects localStorage `audio-muted` flag
- GSAP for page transitions; react-spring for sidebar; framer-motion for cursor
