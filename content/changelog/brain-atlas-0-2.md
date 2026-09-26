---
title: "Brain Atlas 0.2: A WebGL2 Renderer"
date: "2026-08-04"
type: "update"
link: "https://community.obsidian.md/plugins/brain-atlas"
cta: "Install"
status: "released"
featured: false
project: "Obsidian"
---

Moved Brain Atlas to a WebGL2 renderer on desktop in version 0.2. The brain looks exactly the same (a pixel-diff check proves it), but idle rotation now uses about 70% less CPU. Canvas2D stays as the automatic fallback on mobile.

Version 0.2.2 followed community bug reports. The atlas now respects Obsidian's Excluded files setting, signal pulses are back in the new renderer, and dragging turns the brain in the direction you expect.
