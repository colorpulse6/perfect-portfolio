# CLAUDE.md

## Project Overview

Personal portfolio site for Nichalas Barnes. Built with Gatsby 5, TypeScript, React Three Fiber (R3F) particle system, GSAP page transitions, and a Gemini-backed AI terminal.

## Architecture

- **Layout wrapper**: `gatsby-plugin-transition-link` wraps all pages with `src/components/layout.tsx`, which renders the persistent particle background, header, sidebar, and custom cursor.
- **Particle system**: R3F Canvas in `ParticleBackground.tsx` renders instanced mesh particles driven by `useParticlePhysics.ts`. Supports page-specific themes (colors, drift, brightness) with lerp transitions.
- **Floating artifacts**: `DomArtifacts.tsx` manages two artifact types (icon glass squares + changelog cards) with a requestAnimationFrame physics loop (shooting/materializing/floating/dissolving phases). Home page only.
- **Terminal**: `TerminalConsole.tsx` renders on all pages. On home it auto-shows with cycling quotes; on other pages it starts collapsed. Free-form input hits `/.netlify/functions/chat` (Gemini Flash) with page context. Falls back to poetic `FALLBACK_RESPONSES`.
- **Page transitions**: GSAP `autoAlpha` animations keyed to `transitionStatus` prop from transition-link (`entering`/`exiting`).
- **Changelog**: Markdown files in `content/changelog/` processed by `gatsby-transformer-remark`. Rendered on `/changelog` with type filtering and as floating cards on the home page.

## File Structure

```
src/
  components/
    nebula/          # Particle system, artifacts, terminal
    audio/           # Ambient audio engine, interaction sounds
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
```

## Commands

```bash
npx gatsby develop    # Dev server at localhost:8000
npx gatsby build      # Production build
npx gatsby clean      # Clear cache (required after adding plugins)
```

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
