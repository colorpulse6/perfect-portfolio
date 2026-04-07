# Home Page Interactive Nebula Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static home page with an interactive, GPU-rendered nebula particle system using React Three Fiber, with floating discoverable icons and a terminal console overlay.

**Architecture:** Fullscreen R3F Canvas renders the nebula particle field and floating artifacts behind the existing DOM layers. A DOM-based terminal console overlays at the bottom. The existing sidebar navigation is untouched. Components are split by responsibility: particle physics, artifact management, and terminal UI.

**Tech Stack:** React Three Fiber, @react-three/drei, @react-three/postprocessing, Three.js, GSAP (existing), Gatsby (existing), TypeScript

**Spec:** `docs/superpowers/specs/2026-04-06-home-page-interactive-nebula-design.md`

---

## File Structure

```
src/
  components/
    nebula/
      HomeScene.tsx          # R3F Canvas wrapper, composes scene, pointer events
      ParticleField.tsx      # Instanced mesh particle system, physics, bloom
      FloatingArtifact.tsx   # Single artifact sprite: materialize, glow, shatter
      ArtifactManager.tsx    # Manages artifact pool, spawn/respawn timing
      TerminalConsole.tsx    # DOM overlay: cycling quotes, typing effect, commands
      TerminalConsole.css    # Terminal glass-morphism styles
      artifacts.ts           # Artifact data: icons, quotes, links
      useParticlePhysics.ts  # Custom hook: particle positions, velocities, cursor interaction
      useCursorPosition.ts   # Custom hook: normalized cursor position for R3F
  pages/
    index.tsx                # Modified: wraps existing content with HomeScene
    index.css                # Modified: z-index adjustments for layering
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install R3F and Three.js**

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

- [ ] **Step 2: Install Three.js types**

```bash
npm install --save-dev @types/three
```

- [ ] **Step 3: Verify Gatsby dev server still starts**

Run: `npx gatsby develop`
Expected: Server starts without errors on http://localhost:8000

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add react-three-fiber dependencies for home page nebula"
```

---

## Task 2: Cursor Position Hook

**Files:**
- Create: `src/components/nebula/useCursorPosition.ts`

- [ ] **Step 1: Create the hook file**

This hook tracks mouse position in both screen pixels (for DOM) and normalized coordinates (for R3F viewport). It also tracks cursor speed and idle time.

```typescript
import { useEffect, useRef, useCallback } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"

interface CursorState {
  /** Screen position in pixels */
  screen: THREE.Vector2
  /** Previous screen position */
  prevScreen: THREE.Vector2
  /** 3D world position projected onto z=0 plane */
  world: THREE.Vector3
  /** Cursor movement speed (pixels/frame) */
  speed: number
  /** Seconds since last movement */
  idleTime: number
  /** Whether cursor is within the viewport */
  active: boolean
}

export function useCursorPosition(): React.MutableRefObject<CursorState> {
  const { viewport, camera } = useThree()
  const state = useRef<CursorState>({
    screen: new THREE.Vector2(-1000, -1000),
    prevScreen: new THREE.Vector2(-1000, -1000),
    world: new THREE.Vector3(0, 0, 0),
    speed: 0,
    idleTime: 0,
    active: false,
  })

  const raycaster = useRef(new THREE.Raycaster())
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))
  const ndc = useRef(new THREE.Vector2())

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const s = state.current
      s.prevScreen.copy(s.screen)
      s.screen.set(e.clientX, e.clientY)
      s.speed = s.screen.distanceTo(s.prevScreen)
      s.idleTime = 0
      s.active = true

      // Convert to NDC
      ndc.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      )

      // Project to world z=0
      raycaster.current.setFromCamera(ndc.current, camera)
      raycaster.current.ray.intersectPlane(plane.current, s.world)
    },
    [camera]
  )

  const onMouseLeave = useCallback(() => {
    state.current.active = false
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseleave", onMouseLeave)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [onMouseMove, onMouseLeave])

  return state
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/nebula/useCursorPosition.ts
git commit -m "feat: add cursor position tracking hook for R3F"
```

---

## Task 3: Particle Physics Hook

**Files:**
- Create: `src/components/nebula/useParticlePhysics.ts`

- [ ] **Step 1: Create the particle physics hook**

This hook manages the positions, velocities, colors, and autonomous motion of all particles. It runs on each frame via useFrame and writes directly to a Float32Array for the instanced mesh.

```typescript
import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface ParticleConfig {
  count: number
  clusterCount: number
  interactionRadius: number
}

interface ParticleArrays {
  positions: Float32Array
  colors: Float32Array
  scales: Float32Array
  count: number
}

interface InternalParticle {
  orbitCenterX: number
  orbitCenterY: number
  orbitDist: number
  orbitSpeed: number
  orbitPhase: number
  driftAngle: number
  driftSpeed: number
  driftChangeRate: number
  vx: number
  vy: number
  homeX: number
  homeY: number
  clusterIdx: number
  depth: number
  baseAlpha: number
  r: number
  g: number
  b: number
  size: number
}

const COLORS: [number, number, number][] = [
  [0.39, 0.24, 0.78],  // deep purple
  [0.24, 0.39, 0.86],  // blue
  [0.55, 0.31, 0.82],  // violet
  [0.78, 0.43, 0.63],  // pink-purple
  [0.27, 0.55, 0.78],  // teal-blue
  [0.47, 0.24, 0.55],  // dark purple
  [0.31, 0.71, 0.86],  // light blue
  [0.78, 0.55, 0.86],  // lavender
]

function randomColor(): [number, number, number] {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

export function useParticlePhysics(
  config: ParticleConfig,
  cursorRef: React.MutableRefObject<{
    world: THREE.Vector3
    speed: number
    idleTime: number
    active: boolean
  }>
): ParticleArrays {
  const { count, clusterCount, interactionRadius } = config

  // Allocate typed arrays for instanced mesh attributes
  const positions = useMemo(() => new Float32Array(count * 3), [count])
  const colors = useMemo(() => new Float32Array(count * 3), [count])
  const scales = useMemo(() => new Float32Array(count), [count])

  // Internal state not passed to GPU
  const particles = useRef<InternalParticle[]>([])
  const clusters = useRef<
    { cx: number; cy: number; orbitRadius: number; orbitSpeed: number; phase: number; x: number; y: number }[]
  >([])
  const initialized = useRef(false)
  const timeRef = useRef(0)

  // Initialize particles and clusters on first render
  if (!initialized.current) {
    initialized.current = true

    // Spread is based on camera frustum. At z=0 with default perspective camera,
    // visible area is roughly -8..8 on X and -4.5..4.5 on Y (16:9 aspect).
    const spreadX = 10
    const spreadY = 6

    // Create cluster centers
    const clusterArr = []
    for (let i = 0; i < clusterCount; i++) {
      clusterArr.push({
        cx: (Math.random() - 0.5) * spreadX * 1.4,
        cy: (Math.random() - 0.5) * spreadY * 1.4,
        orbitRadius: 0.5 + Math.random() * 1.5,
        orbitSpeed:
          (0.05 + Math.random() * 0.1) * (Math.random() < 0.5 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        x: 0,
        y: 0,
      })
    }
    clusters.current = clusterArr

    // Create particles
    const parts: InternalParticle[] = []
    for (let i = 0; i < count; i++) {
      let x: number, y: number, clusterIdx = -1

      if (Math.random() < 0.65) {
        clusterIdx = Math.floor(Math.random() * clusterCount)
        const c = clusterArr[clusterIdx]
        const angle = Math.random() * Math.PI * 2
        const dist = Math.pow(Math.random(), 0.6) * (1.5 + Math.random() * 2.5)
        x = c.cx + Math.cos(angle) * dist
        y = c.cy + Math.sin(angle) * dist
      } else {
        x = (Math.random() - 0.5) * spreadX * 2
        y = (Math.random() - 0.5) * spreadY * 2
      }

      const col = randomColor()
      const size = 0.02 + Math.random() * 0.06
      const brightness = 0.15 + Math.random() * 0.55

      parts.push({
        orbitCenterX: x,
        orbitCenterY: y,
        orbitDist: 0.1 + Math.random() * 0.8,
        orbitSpeed:
          (0.3 + Math.random() * 1.2) * (Math.random() < 0.5 ? 1 : -1),
        orbitPhase: Math.random() * Math.PI * 2,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: 0.003 + Math.random() * 0.012,
        driftChangeRate: 0.1 + Math.random() * 0.3,
        vx: 0,
        vy: 0,
        homeX: x,
        homeY: y,
        clusterIdx,
        depth: 0.3 + Math.random() * 0.7,
        baseAlpha: brightness,
        r: col[0],
        g: col[1],
        b: col[2],
        size,
      })

      // Initialize GPU arrays
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2 // slight z spread
      colors[i * 3] = col[0]
      colors[i * 3 + 1] = col[1]
      colors[i * 3 + 2] = col[2]
      scales[i] = size
    }
    particles.current = parts
  }

  // Per-frame physics update
  useFrame((_, delta) => {
    const dt = Math.min(delta * 60, 3) // normalize, cap at 3
    timeRef.current += 0.004 * dt
    const t = timeRef.current
    const cursor = cursorRef.current

    // Update idle time
    cursor.idleTime += delta

    // Animate cluster centers
    for (const c of clusters.current) {
      c.phase += c.orbitSpeed * delta
      c.x = c.cx + Math.cos(c.phase) * c.orbitRadius
      c.y = c.cy + Math.sin(c.phase) * c.orbitRadius
    }

    const cx = cursor.world.x
    const cy = cursor.world.y

    for (let i = 0; i < count; i++) {
      const p = particles.current[i]

      // Individual orbital motion
      p.orbitPhase += p.orbitSpeed * delta
      const orbX = Math.cos(p.orbitPhase) * p.orbitDist
      const orbY = Math.sin(p.orbitPhase) * p.orbitDist

      // Drift
      p.driftAngle += Math.sin(t * 2 + i * 0.01) * p.driftChangeRate * delta
      p.orbitCenterX += Math.cos(p.driftAngle) * p.driftSpeed * dt
      p.orbitCenterY += Math.sin(p.driftAngle) * p.driftSpeed * dt

      // Cluster pull
      if (p.clusterIdx >= 0) {
        const c = clusters.current[p.clusterIdx]
        p.orbitCenterX += (c.x + (p.homeX - c.cx) - p.orbitCenterX) * 0.003 * dt
        p.orbitCenterY += (c.y + (p.homeY - c.cy) - p.orbitCenterY) * 0.003 * dt
      } else {
        // Wanderers wrap
        if (p.orbitCenterX < -12) p.orbitCenterX = 12
        if (p.orbitCenterX > 12) p.orbitCenterX = -12
        if (p.orbitCenterY < -8) p.orbitCenterY = 8
        if (p.orbitCenterY > 8) p.orbitCenterY = -8
      }

      // Target
      const targetX = p.orbitCenterX + orbX
      const targetY = p.orbitCenterY + orbY

      p.vx += (targetX - positions[i * 3]) * 0.02 * dt
      p.vy += (targetY - positions[i * 3 + 1]) * 0.02 * dt

      // Cursor interaction
      if (cursor.active) {
        const dx = positions[i * 3] - cx
        const dy = positions[i * 3 + 1] - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const radius = interactionRadius

        if (dist < radius) {
          const force = (1 - dist / radius) * 0.08 * p.depth
          const angle = Math.atan2(dy, dx)
          const swirlDir = i % 2 === 0 ? 1 : -1

          p.vx += Math.cos(angle) * force * dt
          p.vy += Math.sin(angle) * force * dt
          p.vx += Math.cos(angle + Math.PI * 0.5 * swirlDir) * force * 0.4 * dt
          p.vy += Math.sin(angle + Math.PI * 0.5 * swirlDir) * force * 0.4 * dt

          // Brighten
          const alpha = Math.min(1, p.baseAlpha + (1 - dist / radius) * 0.6)
          colors[i * 3] = p.r * (0.5 + alpha * 0.5)
          colors[i * 3 + 1] = p.g * (0.5 + alpha * 0.5)
          colors[i * 3 + 2] = p.b * (0.5 + alpha * 0.5)
          scales[i] = p.size * (1 + (1 - dist / radius) * 0.5)
        } else {
          colors[i * 3] = p.r * (0.5 + p.baseAlpha * 0.5)
          colors[i * 3 + 1] = p.g * (0.5 + p.baseAlpha * 0.5)
          colors[i * 3 + 2] = p.b * (0.5 + p.baseAlpha * 0.5)
          scales[i] = p.size
        }

        // Idle attraction
        if (cursor.idleTime > 5 && dist < radius * 2) {
          p.vx -= dx * 0.0003 * dt
          p.vy -= dy * 0.0003 * dt
        }
      }

      // Damping
      const damp = Math.pow(0.94, dt)
      p.vx *= damp
      p.vy *= damp

      positions[i * 3] += p.vx * dt
      positions[i * 3 + 1] += p.vy * dt
    }
  })

  return { positions, colors, scales, count }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/nebula/useParticlePhysics.ts
git commit -m "feat: add particle physics hook with autonomous motion and cursor interaction"
```

---

## Task 4: Particle Field Component

**Files:**
- Create: `src/components/nebula/ParticleField.tsx`

- [ ] **Step 1: Create the particle field renderer**

This component renders all particles as a single instanced mesh using the physics hook data.

```typescript
import React, { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useParticlePhysics } from "./useParticlePhysics"

interface ParticleFieldProps {
  cursorRef: React.MutableRefObject<{
    world: THREE.Vector3
    speed: number
    idleTime: number
    active: boolean
  }>
  count?: number
}

const ParticleField: React.FC<ParticleFieldProps> = ({
  cursorRef,
  count = 800,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useRef(new THREE.Object3D())

  const { positions, colors, scales } = useParticlePhysics(
    {
      count,
      clusterCount: 7,
      interactionRadius: 2.5,
    },
    cursorRef
  )

  // Update instanced mesh matrices and colors each frame
  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    for (let i = 0; i < count; i++) {
      dummy.current.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      )
      dummy.current.scale.setScalar(scales[i])
      dummy.current.updateMatrix()
      mesh.setMatrixAt(i, dummy.current.matrix)
      mesh.setColorAt(
        i,
        new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
      )
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <circleGeometry args={[1, 8]} />
      <meshBasicMaterial transparent opacity={0.8} toneMapped={false} />
    </instancedMesh>
  )
}

export default ParticleField
```

- [ ] **Step 2: Commit**

```bash
git add src/components/nebula/ParticleField.tsx
git commit -m "feat: add instanced particle field renderer"
```

---

## Task 5: Artifact Data

**Files:**
- Create: `src/components/nebula/artifacts.ts`

- [ ] **Step 1: Create artifact definitions**

```typescript
export interface ArtifactDef {
  id: string
  /** SVG path data for the icon */
  iconPaths: string[]
  /** Quote shown in terminal on click */
  quote: string
  /** Internal route to navigate to, or null */
  link: string | null
  /** External URL to open, or null */
  externalLink: string | null
  /** Viewbox for the SVG */
  viewBox: string
}

export const ARTIFACTS: ArtifactDef[] = [
  {
    id: "music",
    iconPaths: [
      "M9 18V5l12-2v13",
      "M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z",
      "M21 16c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z",
    ],
    quote: "10 years. 10 albums. 12 countries.",
    link: "/about/",
    externalLink: null,
    viewBox: "0 0 24 24",
  },
  {
    id: "code",
    iconPaths: ["M16 18l6-6-6-6", "M8 6l-6 6 6 6"],
    quote: "TypeScript, React, Remix. The new instrument.",
    link: "/projects/",
    externalLink: null,
    viewBox: "0 0 24 24",
  },
  {
    id: "terminal",
    iconPaths: [
      "M2 3h20a2 2 0 012 2v14a2 2 0 01-2 2H2a2 2 0 01-2-2V5a2 2 0 012-2z",
      "M8 21h8",
      "M12 17v4",
    ],
    quote: "Obsession is the education.",
    link: null,
    externalLink: null,
    viewBox: "0 0 24 24",
  },
  {
    id: "writing",
    iconPaths: ["M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"],
    quote: "Sometimes the best debugging happens in prose.",
    link: "/writing/",
    externalLink: null,
    viewBox: "0 0 24 24",
  },
  {
    id: "waveform",
    iconPaths: [
      "M2 12h2l2-4 3 8 3-8 3 8 2-4h3",
    ],
    quote: "Signal flow. Troubleshooting. Precision.",
    link: null,
    externalLink: null,
    viewBox: "0 0 24 24",
  },
  {
    id: "gamepad",
    iconPaths: [
      "M6 11h4",
      "M8 9v4",
      "M15 12h.01",
      "M18 10h.01",
      "M17.32 5H6.68a4 4 0 00-3.978 3.59C2.218 12.16 2 16.28 2 17.5a2.5 2.5 0 005 0l1.43-4.39a1 1 0 01.95-.69h5.24a1 1 0 01.95.69L17 17.5a2.5 2.5 0 005 0c0-1.22-.218-5.34-.702-8.91A4 4 0 0017.32 5z",
    ],
    quote: "I've been building since before I could code.",
    link: null,
    externalLink: null,
    viewBox: "0 0 24 24",
  },
]

/** Quotes that cycle in terminal but are not tied to an artifact */
export const CYCLING_QUOTES: string[] = [
  "10 years. 10 albums. 12 countries.",
  "Signal flow. Troubleshooting. Precision.",
  "TypeScript, React, Remix. The new instrument.",
  "Obsession is the education.",
  "I've been building since before I could code.",
  "Sometimes the best debugging happens in prose.",
  "The medium changed. The discipline didn't.",
  "Sci-fi Low-fi Li-fe",
]

/** Terminal command responses */
export const TERMINAL_COMMANDS: Record<
  string,
  { response: string; action: "navigate" | "external" | "clear" | "none"; target?: string }
> = {
  help: {
    response:
      "Available commands: about, projects, music, writing, contact, clear",
    action: "none",
  },
  about: {
    response: "Pulling up the origin story...",
    action: "navigate",
    target: "/about/",
  },
  projects: {
    response: "Loading the portfolio...",
    action: "navigate",
    target: "/projects/",
  },
  music: {
    response: "Opening the archives. Turn it up.",
    action: "external",
    target: "https://alexshand.bandcamp.com/",
  },
  writing: {
    response: "Words are just another medium.",
    action: "navigate",
    target: "/writing/",
  },
  contact: {
    response: "Let's talk.",
    action: "navigate",
    target: "/contact/",
  },
  clear: {
    response: "",
    action: "clear",
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/nebula/artifacts.ts
git commit -m "feat: add artifact definitions, quotes, and terminal commands"
```

---

## Task 6: Floating Artifact Component

**Files:**
- Create: `src/components/nebula/FloatingArtifact.tsx`

- [ ] **Step 1: Create the floating artifact component**

Each artifact uses `drei`'s `Html` component to render a real DOM element (frosted-glass container with SVG icon) positioned in 3D space. This gives us `backdrop-filter: blur`, proper SVG rendering, and click handling for free.

```typescript
import React, { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import * as THREE from "three"
import { ArtifactDef } from "./artifacts"

interface FloatingArtifactProps {
  artifact: ArtifactDef
  startPosition: [number, number, number]
  cursorRef: React.MutableRefObject<{
    world: THREE.Vector3
    active: boolean
  }>
  onActivate: (artifact: ArtifactDef) => void
  onShatter: (position: THREE.Vector3) => void
  visible: boolean
}

type Phase = "materializing" | "floating" | "shattering" | "hidden"

const glassStyle: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
  pointerEvents: "auto" as const,
}

const FloatingArtifact: React.FC<FloatingArtifactProps> = ({
  artifact,
  startPosition,
  cursorRef,
  onActivate,
  onShatter,
  visible,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const [phase, setPhase] = useState<Phase>("hidden")
  const [opacity, setOpacity] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const phaseTime = useRef(0)
  const driftAngle = useRef(Math.random() * Math.PI * 2)
  const floatPhase = useRef(Math.random() * Math.PI * 2)
  const position = useRef(new THREE.Vector3(...startPosition))
  const opacityRef = useRef(0)

  React.useEffect(() => {
    if (visible && phase === "hidden") {
      position.current.set(...startPosition)
      setPhase("materializing")
      phaseTime.current = 0
      opacityRef.current = 0
    }
  }, [visible, startPosition])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    phaseTime.current += delta
    const pos = position.current
    const group = groupRef.current

    switch (phase) {
      case "materializing":
        opacityRef.current = Math.min(1, phaseTime.current / 1.5)
        if (phaseTime.current > 1.5) {
          setPhase("floating")
          phaseTime.current = 0
        }
        break

      case "floating":
        driftAngle.current += delta * 0.1
        pos.x += Math.cos(driftAngle.current) * 0.15 * delta
        pos.y += Math.sin(driftAngle.current) * 0.1 * delta
        floatPhase.current += delta * 0.8
        pos.y += Math.sin(floatPhase.current) * 0.003

        if (phaseTime.current > 10) {
          opacityRef.current = Math.max(0, 1 - (phaseTime.current - 10) / 2)
          if (opacityRef.current <= 0) setPhase("hidden")
        }
        break

      case "shattering":
        opacityRef.current = Math.max(0, 1 - phaseTime.current / 0.4)
        const s = 1 + phaseTime.current * 2
        group.scale.setScalar(s)
        if (phaseTime.current > 0.4) {
          setPhase("hidden")
          group.scale.setScalar(1)
        }
        break

      case "hidden":
        opacityRef.current = 0
        return
    }

    group.position.copy(pos)
    setOpacity(opacityRef.current)
  })

  const handleClick = () => {
    if (phase !== "floating" && phase !== "materializing") return
    onActivate(artifact)
    onShatter(position.current.clone())
    setPhase("shattering")
    phaseTime.current = 0
  }

  if (phase === "hidden") return null

  return (
    <group ref={groupRef}>
      <Html center style={{ opacity, transition: "opacity 0.1s" }}>
        <div
          style={{
            ...glassStyle,
            background: isHovered
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.03)",
            borderColor: isHovered
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,255,255,0.06)",
            boxShadow: isHovered
              ? "0 0 40px rgba(140,120,255,0.12)"
              : "none",
            transform: isHovered ? "scale(1.12)" : "scale(1)",
          }}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <svg
            viewBox={artifact.viewBox}
            width={20}
            height={20}
            fill="none"
            stroke={
              isHovered
                ? "rgba(255,255,255,0.8)"
                : "rgba(255,255,255,0.35)"
            }
            strokeWidth={1.5}
          >
            {artifact.iconPaths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        </div>
      </Html>
    </group>
  )
}

export default FloatingArtifact
```

- [ ] **Step 2: Commit**

```bash
git add src/components/nebula/FloatingArtifact.tsx
git commit -m "feat: add floating artifact component with materialize/shatter lifecycle"
```

---

## Task 7: Artifact Manager Component

**Files:**
- Create: `src/components/nebula/ArtifactManager.tsx`

- [ ] **Step 1: Create the artifact pool manager**

Manages which artifacts are visible, spawn positions, respawn timers. Limits 2-3 visible at a time.

```typescript
import React, { useState, useEffect, useCallback, useRef } from "react"
import * as THREE from "three"
import FloatingArtifact from "./FloatingArtifact"
import { ARTIFACTS, ArtifactDef } from "./artifacts"

interface ArtifactManagerProps {
  cursorRef: React.MutableRefObject<{
    world: THREE.Vector3
    active: boolean
  }>
  onArtifactActivate: (artifact: ArtifactDef) => void
}

function randomEdgePosition(): [number, number, number] {
  const side = Math.floor(Math.random() * 4)
  const spread = 5
  switch (side) {
    case 0: return [-spread - 2, (Math.random() - 0.5) * spread * 2, 0]
    case 1: return [spread + 2, (Math.random() - 0.5) * spread * 2, 0]
    case 2: return [(Math.random() - 0.5) * spread * 2, spread + 2, 0]
    default: return [(Math.random() - 0.5) * spread * 2, -spread - 2, 0]
  }
}

const MAX_VISIBLE = 3

const ArtifactManager: React.FC<ArtifactManagerProps> = ({
  cursorRef,
  onArtifactActivate,
}) => {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const cooldowns = useRef<Map<string, number>>(new Map())
  const positions = useRef<Map<string, [number, number, number]>>(new Map())

  // Initialize positions
  useEffect(() => {
    for (const a of ARTIFACTS) {
      positions.current.set(a.id, randomEdgePosition())
    }
  }, [])

  // Spawn loop: check every 2 seconds, spawn if under max
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleIds((prev) => {
        if (prev.size >= MAX_VISIBLE) return prev

        // Find artifacts not visible and not on cooldown
        const now = Date.now()
        const available = ARTIFACTS.filter(
          (a) =>
            !prev.has(a.id) &&
            (!cooldowns.current.has(a.id) ||
              now > (cooldowns.current.get(a.id) ?? 0))
        )

        if (available.length === 0) return prev

        const pick = available[Math.floor(Math.random() * available.length)]
        positions.current.set(pick.id, randomEdgePosition())
        const next = new Set(prev)
        next.add(pick.id)
        return next
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleShatter = useCallback((_position: THREE.Vector3) => {
    // Could spawn burst particles here in future
  }, [])

  const handleActivate = useCallback(
    (artifact: ArtifactDef) => {
      onArtifactActivate(artifact)
      // Remove from visible, set cooldown
      setVisibleIds((prev) => {
        const next = new Set(prev)
        next.delete(artifact.id)
        return next
      })
      cooldowns.current.set(artifact.id, Date.now() + 12000) // 12s cooldown
    },
    [onArtifactActivate]
  )

  return (
    <>
      {ARTIFACTS.map((artifact) => (
        <FloatingArtifact
          key={artifact.id}
          artifact={artifact}
          startPosition={
            positions.current.get(artifact.id) ?? randomEdgePosition()
          }
          cursorRef={cursorRef}
          onActivate={handleActivate}
          onShatter={handleShatter}
          visible={visibleIds.has(artifact.id)}
        />
      ))}
    </>
  )
}

export default ArtifactManager
```

- [ ] **Step 2: Commit**

```bash
git add src/components/nebula/ArtifactManager.tsx
git commit -m "feat: add artifact manager with spawn pool and cooldown logic"
```

---

## Task 8: Terminal Console Component

**Files:**
- Create: `src/components/nebula/TerminalConsole.tsx`
- Create: `src/components/nebula/TerminalConsole.css`

- [ ] **Step 1: Create the terminal CSS**

```css
.terminal-console {
  position: fixed;
  bottom: 16px;
  left: 10%;
  right: 10%;
  max-height: 200px;
  background: rgba(8, 8, 16, 0.82);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 14px 20px;
  font-family: "SF Mono", "Fira Code", "Courier New", monospace;
  z-index: 20;
  transform: translateY(120%);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
}

.terminal-console.visible {
  transform: translateY(0);
}

.terminal-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.terminal-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.terminal-line {
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.5);
  min-height: 1.8em;
}

.terminal-line .explore-link {
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
  margin-left: 8px;
  cursor: pointer;
  transition: color 0.2s;
}

.terminal-line .explore-link:hover {
  color: rgba(255, 255, 255, 0.7);
}

.terminal-input-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.terminal-prompt {
  color: rgba(255, 255, 255, 0.15);
  font-size: 13px;
}

.terminal-input {
  background: none;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
  font-size: 13px;
  flex: 1;
  caret-color: rgba(255, 255, 255, 0.5);
}

.terminal-cursor {
  display: inline-block;
  width: 8px;
  height: 14px;
  background: rgba(255, 255, 255, 0.4);
  animation: terminal-blink 1s step-end infinite;
  vertical-align: middle;
}

@keyframes terminal-blink {
  50% {
    opacity: 0;
  }
}

.terminal-dismiss {
  display: none;
}

/* Mobile */
@media only screen and (max-width: 550px) {
  .terminal-console {
    left: 8px;
    right: 8px;
    bottom: 8px;
    padding: 10px 14px;
  }

  .terminal-line {
    font-size: 11px;
  }

  .terminal-input-line {
    display: none;
  }

  .terminal-dismiss {
    display: block;
    position: absolute;
    top: 10px;
    right: 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    font-size: 16px;
    cursor: pointer;
  }
}
```

- [ ] **Step 2: Create the terminal console component**

```typescript
import React, { useState, useEffect, useRef, useCallback } from "react"
import { navigate } from "gatsby"
import { CYCLING_QUOTES, TERMINAL_COMMANDS, ArtifactDef } from "./artifacts"
import "./TerminalConsole.css"

interface TerminalConsoleProps {
  /** Artifact that was just clicked, triggers quote display */
  activatedArtifact: ArtifactDef | null
  /** Callback when terminal requests hide */
  onDismiss: () => void
  /** If true, terminal auto-shows (WebGL fallback mode) */
  forceVisible?: boolean
}

const TYPE_SPEED = 40 // ms per character
const HOLD_DURATION = 5000 // ms to hold quote before cycling
const CLEAR_DURATION = 300 // ms to clear

const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  activatedArtifact,
  onDismiss,
  forceVisible = false,
}) => {
  const [visible, setVisible] = useState(false)
  const hasInteracted = useRef(false)
  const [displayText, setDisplayText] = useState("")
  const [commandInput, setCommandInput] = useState("")
  const [responseText, setResponseText] = useState("")
  const [exploreLink, setExploreLink] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cycleIndex = useRef(0)
  const cycleTimer = useRef<NodeJS.Timeout | null>(null)
  const typeTimer = useRef<NodeJS.Timeout | null>(null)
  const isPaused = useRef(false)

  // Type out text character by character
  const typeText = useCallback(
    (text: string, onComplete?: () => void) => {
      let i = 0
      setDisplayText("")
      const tick = () => {
        if (i < text.length) {
          setDisplayText(text.substring(0, i + 1))
          i++
          typeTimer.current = setTimeout(tick, TYPE_SPEED)
        } else if (onComplete) {
          onComplete()
        }
      }
      tick()
    },
    []
  )

  // Start the cycling loop
  const startCycle = useCallback(() => {
    if (isPaused.current) return

    const quote = CYCLING_QUOTES[cycleIndex.current % CYCLING_QUOTES.length]
    setExploreLink(null)
    typeText(quote, () => {
      cycleTimer.current = setTimeout(() => {
        cycleIndex.current++
        startCycle()
      }, HOLD_DURATION)
    })
  }, [typeText])

  // If WebGL is unavailable (forceVisible), show terminal immediately with cycling
  useEffect(() => {
    if (forceVisible) {
      setVisible(true)
      startCycle()
    }

    return () => {
      if (cycleTimer.current) clearTimeout(cycleTimer.current)
      if (typeTimer.current) clearTimeout(typeTimer.current)
    }
  }, [forceVisible, startCycle])

  // Handle artifact activation (first interaction shows terminal)
  useEffect(() => {
    if (!activatedArtifact) return

    if (!hasInteracted.current) {
      hasInteracted.current = true
    }

    // Pause cycling
    isPaused.current = true
    if (cycleTimer.current) clearTimeout(cycleTimer.current)
    if (typeTimer.current) clearTimeout(typeTimer.current)

    setVisible(true)
    const link = activatedArtifact.link || activatedArtifact.externalLink
    setExploreLink(link)

    typeText(activatedArtifact.quote, () => {
      // Resume cycling after hold
      setTimeout(() => {
        isPaused.current = false
        cycleIndex.current++
        startCycle()
      }, HOLD_DURATION)
    })
  }, [activatedArtifact, typeText, startCycle])

  const handleCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase()
      if (!trimmed) return

      const command = TERMINAL_COMMANDS[trimmed]
      if (!command) {
        setResponseText(
          "Command not found. Type 'help' to see what's possible."
        )
        setCommandInput("")
        return
      }

      if (command.action === "clear") {
        setDisplayText("")
        setResponseText("")
        setCommandInput("")
        setVisible(false)
        onDismiss()
        return
      }

      // Pause cycling and type response
      isPaused.current = true
      if (cycleTimer.current) clearTimeout(cycleTimer.current)
      if (typeTimer.current) clearTimeout(typeTimer.current)

      setResponseText("")
      setCommandInput("")
      typeText(command.response, () => {
        if (command.action === "navigate" && command.target) {
          setTimeout(() => navigate(command.target!), 800)
        } else if (command.action === "external" && command.target) {
          setTimeout(() => window.open(command.target, "_blank"), 800)
        } else {
          // Resume cycling
          setTimeout(() => {
            isPaused.current = false
            startCycle()
          }, HOLD_DURATION)
        }
      })
    },
    [typeText, startCycle, onDismiss]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand(commandInput)
    }
  }

  const handleExploreClick = () => {
    if (!exploreLink) return
    if (exploreLink.startsWith("http")) {
      window.open(exploreLink, "_blank")
    } else {
      navigate(exploreLink)
    }
  }

  return (
    <div className={`terminal-console${visible ? " visible" : ""}`}>
      <button
        className="terminal-dismiss"
        onClick={() => {
          setVisible(false)
          onDismiss()
        }}
      >
        x
      </button>
      <div className="terminal-dots">
        <div className="terminal-dot" />
        <div className="terminal-dot" />
        <div className="terminal-dot" />
      </div>
      <div className="terminal-line">
        {displayText}
        {exploreLink && displayText.length > 0 && (
          <span className="explore-link" onClick={handleExploreClick}>
            explore &rarr;
          </span>
        )}
      </div>
      {responseText && (
        <div className="terminal-line" style={{ color: "rgba(255,255,255,0.35)" }}>
          {responseText}
        </div>
      )}
      <div className="terminal-input-line">
        <span className="terminal-prompt">&gt;</span>
        <input
          ref={inputRef}
          className="terminal-input"
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}

export default TerminalConsole
```

- [ ] **Step 3: Commit**

```bash
git add src/components/nebula/TerminalConsole.tsx src/components/nebula/TerminalConsole.css
git commit -m "feat: add terminal console with cycling quotes and command input"
```

---

## Task 9: Home Scene (R3F Canvas Wrapper)

**Files:**
- Create: `src/components/nebula/HomeScene.tsx`

- [ ] **Step 1: Create the scene wrapper**

This is the main R3F Canvas that composes the particle field and artifact manager. It also manages the bridge between R3F and the DOM terminal.

```typescript
import React, { useState, useCallback, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import ParticleField from "./ParticleField"
import ArtifactManager from "./ArtifactManager"
import TerminalConsole from "./TerminalConsole"
import { useCursorPosition } from "./useCursorPosition"
import { ArtifactDef } from "./artifacts"

/** Inner scene that uses R3F hooks (must be inside Canvas) */
const SceneContent: React.FC<{
  onArtifactActivate: (artifact: ArtifactDef) => void
}> = ({ onArtifactActivate }) => {
  const cursorRef = useCursorPosition()
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 550

  return (
    <>
      <ParticleField cursorRef={cursorRef} count={isMobile ? 350 : 800} />
      <ArtifactManager
        cursorRef={cursorRef}
        onArtifactActivate={onArtifactActivate}
      />
      {!isMobile && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={0.8}
          />
        </EffectComposer>
      )}
    </>
  )
}

/** Detect WebGL support */
function hasWebGL(): boolean {
  if (typeof window === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    return !!(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    )
  } catch {
    return false
  }
}

const HomeScene: React.FC = () => {
  const [isClient, setIsClient] = useState(false)
  const [webglAvailable, setWebglAvailable] = useState(true)
  const [activatedArtifact, setActivatedArtifact] =
    useState<ArtifactDef | null>(null)

  React.useEffect(() => {
    setIsClient(true)
    setWebglAvailable(hasWebGL())
  }, [])

  const handleArtifactActivate = useCallback((artifact: ArtifactDef) => {
    setActivatedArtifact(artifact)
  }, [])

  const handleDismiss = useCallback(() => {
    // Terminal dismissed
  }, [])

  return (
    <>
      {isClient && webglAvailable && (
        <Canvas
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
          camera={{ position: [0, 0, 8], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <SceneContent onArtifactActivate={handleArtifactActivate} />
          </Suspense>
        </Canvas>
      )}
      <TerminalConsole
        activatedArtifact={activatedArtifact}
        onDismiss={handleDismiss}
        forceVisible={isClient && !webglAvailable}
      />
    </>
  )
}

export default HomeScene
```

- [ ] **Step 2: Commit**

```bash
git add src/components/nebula/HomeScene.tsx
git commit -m "feat: add HomeScene R3F canvas wrapper with bloom and terminal bridge"
```

---

## Task 10: Integrate into Home Page

**Files:**
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/index.css`

- [ ] **Step 1: Update index.tsx to render HomeScene behind existing content**

Replace the contents of `src/pages/index.tsx` with:

```typescript
import React from "react"
import gsap from "gsap"
import SEO from "../components/seo"
import HomeScene from "../components/nebula/HomeScene"
import "./index.css"

interface GatsbyLocation {
  pathname: string
  search?: string
  hash?: string
  href?: string
  origin?: string
  protocol?: string
  host?: string
  hostname?: string
  port?: string
  state?: any
  key?: string
}

interface IndexPageProps {
  transitionStatus?: string
  location?: GatsbyLocation
}

const IndexPage: React.FC<IndexPageProps> = ({
  transitionStatus,
  location,
}) => {
  React.useEffect(() => {
    gsap.to(".hometex", {
      autoAlpha: 1,
      duration: 1,
    })
  }, [])

  React.useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".hometex", {
        autoAlpha: 1,
        duration: 3.5,
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".hometex", {
        autoAlpha: 0,
        duration: 1,
      })
    }
  }, [transitionStatus])

  return (
    <div>
      <HomeScene />
      <div style={{ opacity: 0, position: "relative", zIndex: 2 }} className="hometex">
        <SEO title="Home" />
        <div className="title">
          <h1 className="background-video">Hello...</h1>
        </div>
      </div>
    </div>
  )
}

export default IndexPage
```

- [ ] **Step 2: Update index.css for layering**

Add `position: relative` and `z-index: 2` to the `.title` class, and ensure `pointer-events: none` on the title so clicks pass through to the canvas, while keeping text selectable:

In `src/pages/index.css`, update the `.title` rule:

```css
.title {
  font-family: "Montserrat", serif;
  text-align: center;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  letter-spacing: 1px;
  margin-left: -250px;
  margin-top: -150px;
  position: relative;
  z-index: 2;
  pointer-events: none;
}
```

- [ ] **Step 3: Verify the dev server starts and the home page renders**

Run: `npx gatsby develop`
Expected: Home page shows the nebula canvas behind the "Hello..." text, particles are moving, terminal console appears after 2 seconds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.tsx src/pages/index.css
git commit -m "feat: integrate nebula scene into home page"
```

---

## Task 11: Polish and Performance Tuning

**Files:**
- Modify: `src/components/nebula/ParticleField.tsx`
- Modify: `src/components/nebula/HomeScene.tsx`

- [ ] **Step 1: Optimize instanced mesh color updates**

In `ParticleField.tsx`, avoid creating a new `THREE.Color` per particle per frame. Use a reusable color instance:

```typescript
// At the top of the component, add:
const tempColor = useRef(new THREE.Color())

// In the useFrame loop, replace:
//   mesh.setColorAt(i, new THREE.Color(colors[i * 3], ...))
// With:
tempColor.current.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
mesh.setColorAt(i, tempColor.current)
```

- [ ] **Step 2: Add frameloop="demand" consideration**

If performance is an issue, the Canvas can use `frameloop="always"` (default) but reduce particle count. Test on target hardware. No code change needed unless performance is poor.

- [ ] **Step 3: Verify 60fps on desktop**

Open browser DevTools > Performance tab, record 5 seconds of cursor interaction. Frame time should be consistently under 16ms.

- [ ] **Step 4: Commit**

```bash
git add src/components/nebula/ParticleField.tsx
git commit -m "perf: optimize particle color updates to avoid per-frame allocations"
```

---

## Task 12: Final Integration Test

- [ ] **Step 1: Test full page flow**

Run: `npx gatsby develop`

Verify:
1. Home page loads, nebula particles are visible and moving autonomously
2. Cursor interaction: particles repel and swirl around cursor
3. Floating icons appear, glow on hover, shatter on click
4. Terminal console appears, cycles through quotes with typing effect
5. Terminal commands work: type `help`, `about`, `projects`, `music`, `writing`, `contact`, `clear`
6. Sidebar navigation still works independently
7. "Hello..." text is visible above the nebula
8. Page transitions to/from other pages work (no canvas artifacts)

- [ ] **Step 2: Test mobile**

Open browser DevTools, toggle device toolbar to a mobile viewport (e.g., iPhone 14).

Verify:
1. Reduced particle count (visually less dense but still present)
2. No bloom effect
3. Terminal shows cycling quotes, no input field
4. Dismiss button ("x") works on terminal
5. Icons respond to tap

- [ ] **Step 3: Test gatsby build**

Run: `npx gatsby build && npx gatsby serve`
Expected: Production build succeeds, served site works identically to dev.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete interactive nebula home page"
```
