# Home Page Interactive Nebula Design

## Overview

Replace the current static home page with an interactive, GPU-rendered nebula particle system using React Three Fiber (R3F). The page becomes a living, explorable environment where visitors discover content by interacting with floating icons and a terminal console.

## Architecture

Four layers stacked on top of each other:

- **Layer 0 (Sidebar):** Existing collapsed sidebar navigation. Untouched.
- **Layer 1 (R3F Canvas):** Fullscreen, `position: fixed`, `z-index: 0`. Contains the nebula particle field and floating icon artifacts. GPU-rendered via WebGL.
- **Layer 2 (Title):** Existing "Hello..." text, positioned above the canvas. Keeps current gif-texture background-clip styling.
- **Layer 3 (Terminal Console):** DOM overlay pinned to viewport bottom. Glass-morphism styling with backdrop blur. Hidden by default, appears on first interaction.

The sidebar remains fully functional as a parallel navigation path. The interactive layer is an optional exploration experience.

## The Nebula Particle Field

### Appearance
- 800-900 glowing particles in clusters, with color palette of deep purples, blues, violets, and soft pinks
- Particles vary in size (1-4px) and brightness (0.15-0.7 alpha)
- ~65% of particles belong to clusters (dense nebula regions), ~35% are wanderers streaming between clusters
- Bloom post-processing via `@react-three/postprocessing` for soft glow
- 6-7 cluster centers that slowly orbit their home positions

### Autonomous Motion
Every particle moves on its own at all times:
- Each particle follows a small local orbit (15-60px radius) at its own speed and direction
- Particles drift with slowly changing direction, creating wandering currents
- Cluster centers rotate, so dense regions of the nebula shift and breathe as a group
- Wanderer particles stream across the scene and wrap around edges
- The whole field is constantly evolving even with no cursor interaction

### Cursor Interaction
- Cursor projects a repulsion force field (~160px radius)
- Nearby particles displace and swirl around the cursor (perpendicular force creates turbulence)
- Particles brighten as cursor approaches
- A subtle glow halo follows the cursor position
- When cursor stops, particles slowly drift back to their natural paths
- After 5+ seconds idle, nebula wisps curl toward cursor as if curious

### Mobile
- Particle count reduced to ~300-400
- No bloom post-processing (GPU savings)
- Touch point acts as cursor position

## Floating Icons (Artifacts)

### Appearance
- Sleek, minimal SVG icons inside frosted-glass containers (`backdrop-filter: blur`, subtle border, rounded corners)
- 2-3 visible at any time from a pool of 6-7
- They materialize from nothing, drift slowly, then dissolve. Not always present.

### Pool of Artifacts

| Icon | Visual | Quote on click | Links to |
|------|--------|---------------|----------|
| Musical note | SVG music note | "10 years. 10 albums. 12 countries." | /about |
| Code brackets | `</>` SVG | "TypeScript, React, Remix. The new instrument." | /projects |
| Terminal/monitor | Monitor SVG | "Obsession is the education." | none |
| Pen/quill | Pen SVG | "Sometimes the best debugging happens in prose." | /writing |
| Waveform | Audio wave SVG | "Signal flow. Troubleshooting. Precision." | none |
| Game controller | Gamepad SVG | "I've been building since before I could code." | none |

Icons that link to a page show a subtle "explore" prompt after the quote types. Icons without a link just reveal the quote.

The remaining quotes ("The medium changed. The discipline didn't." and "Sci-fi Low-fi Li-fe") appear only in the cycling loop, not tied to artifacts.

### Behavior
- Icons materialize with a scale+fade animation, visible for 8-12 seconds, then dissolve
- On hover: icon brightens, nearby particles orbit toward it
- On click: icon shatters into 20-30 particles that join the nebula, quote types into terminal console
- After shattering, the icon respawns from the pool after a 10-15 second delay
- Staggered timing so icons don't all appear/disappear at once

### Mobile
- Same behavior, tap replaces hover+click
- Slightly larger touch targets (52px)

## Terminal Console

### Appearance
- Glass-morphism panel: `rgba(8,8,16,0.82)` background, `backdrop-filter: blur(24px)`, subtle border, rounded top corners
- Three dots at top (macOS terminal style)
- Monospace font (SF Mono / Fira Code / system monospace)
- Pinned to bottom of viewport, ~80% width centered
- Max height ~200px

### Cycling Quotes
The terminal types quotes in a loop, independent of user interaction:

1. "10 years. 10 albums. 12 countries."
2. "Signal flow. Troubleshooting. Precision."
3. "TypeScript, React, Remix. The new instrument."
4. "Obsession is the education."
5. "I've been building since before I could code."
6. "Sometimes the best debugging happens in prose."
7. "The medium changed. The discipline didn't."
8. "Sci-fi Low-fi Li-fe"

Behavior: type quote character by character (~40ms per char), hold for ~5 seconds, clear, type next quote. Loop continuously.

When an artifact is clicked, the cycling pauses, the artifact's associated quote types out, then cycling resumes after a delay.

### Command Input
After each quote, a blinking cursor appears on a new line: `> _`

Visitor can type commands:

| Command | Response | Action |
|---------|----------|--------|
| `help` | Lists available commands | none |
| `about` | "Pulling up the origin story..." | navigates to /about |
| `projects` | "Loading the portfolio..." | navigates to /projects |
| `music` | "Opening the archives. Turn it up." | opens bandcamp in new tab |
| `writing` | "Words are just another medium." | navigates to /writing |
| `contact` | "Let's talk." | navigates to /contact |
| `clear` | clears console | hides console |
| anything else | "Command not found. Type 'help' to see what's possible." | none |

### Mobile
- Full width with smaller font
- Display-only (no keyboard input). Shows cycling quotes and artifact quotes only.
- Small "x" button to dismiss

## Components

| Component | Type | Responsibility |
|-----------|------|---------------|
| `HomeScene` | R3F Canvas wrapper | Composes ParticleField + ArtifactManager, handles pointer events, wraps in Canvas with post-processing |
| `ParticleField` | R3F component | Instanced mesh for all particles, cursor repulsion physics, autonomous orbital/drift motion, bloom |
| `FloatingArtifact` | R3F sprite | Single artifact: materialize/dissolve animation, glow on proximity, shatter on click |
| `ArtifactManager` | R3F component | Manages artifact pool: spawn timing, stagger, respawn after shatter, limits visible count to 2-3 |
| `TerminalConsole` | DOM React component | Glass panel overlay, character-by-character typing, cycling quote loop, command input parsing, navigation |

## Dependencies to Install

- `@react-three/fiber` (React renderer for Three.js)
- `@react-three/drei` (helpers: Float, Billboard, useTexture, etc.)
- `@react-three/postprocessing` (bloom effect)
- `three` (peer dependency)

Existing dependencies that will be used: GSAP (terminal slide animation), React, TypeScript, Gatsby (framework/routing).

## Constraints

- No em-dashes anywhere in text content
- Sidebar navigation remains untouched and fully functional
- "Hello..." title text stays in its current position and styling
- The page must remain functional (navigable) even if WebGL fails to load. Terminal and sidebar provide fallback navigation. If WebGL is unavailable, the terminal console should auto-appear (visible by default) so visitors can still navigate via commands.
- Performance target: 60fps on modern desktop, 30fps+ on mobile
