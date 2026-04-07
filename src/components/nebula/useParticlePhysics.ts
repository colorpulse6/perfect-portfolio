import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { ParticleTheme } from "./particleThemes"

interface ParticleConfig {
  count: number
  clusterCount: number
  interactionRadius: number
  theme: ParticleTheme
}

interface ParticleArrays {
  positions: Float32Array
  colors: Float32Array
  scales: Float32Array
  count: number
  opacityRef: React.MutableRefObject<number>
}

interface InternalParticle {
  orbitCenterX: number
  orbitCenterY: number
  orbitDist: number
  orbitSpeed: number
  orbitPhase: number
  driftAngle: number
  baseDriftSpeed: number
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
  targetR: number
  targetG: number
  targetB: number
  targetAlpha: number
  size: number
}

interface PhysicsMultipliers {
  drift: number
  orbit: number
  damping: number
}

const LERP_SPEED = 0.025

function pickColor(theme: ParticleTheme): [number, number, number] {
  return theme.colors[Math.floor(Math.random() * theme.colors.length)]
}

function pickBrightness(theme: ParticleTheme): number {
  const [min, max] = theme.brightnessRange
  return min + Math.random() * (max - min)
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
  const { count, clusterCount, interactionRadius, theme } = config

  const positions = useMemo(() => new Float32Array(count * 3), [count])
  const colors = useMemo(() => new Float32Array(count * 3), [count])
  const scales = useMemo(() => new Float32Array(count), [count])

  const particles = useRef<InternalParticle[]>([])
  const clusters = useRef<
    { cx: number; cy: number; orbitRadius: number; orbitSpeed: number; phase: number; x: number; y: number }[]
  >([])
  const initialized = useRef(false)
  const timeRef = useRef(0)
  const opacityRef = useRef(theme.opacity)
  const prevThemeRef = useRef(theme)
  const physicsRef = useRef<PhysicsMultipliers>({
    drift: theme.driftMultiplier,
    orbit: theme.orbitMultiplier,
    damping: theme.damping,
  })

  if (!initialized.current) {
    initialized.current = true

    const spreadX = 10
    const spreadY = 6

    const clusterArr = []
    for (let i = 0; i < clusterCount; i++) {
      clusterArr.push({
        cx: (Math.random() - 0.5) * spreadX * 1.4,
        cy: (Math.random() - 0.5) * spreadY * 1.4,
        orbitRadius: 0.3 + Math.random() * 0.8,
        orbitSpeed:
          (0.003 + Math.random() * 0.006) * (Math.random() < 0.5 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        x: 0,
        y: 0,
      })
    }
    clusters.current = clusterArr

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

      const col = pickColor(theme)
      const size = 0.008 + Math.random() * 0.03
      const brightness = pickBrightness(theme)

      parts.push({
        orbitCenterX: x,
        orbitCenterY: y,
        orbitDist: 0.15 + Math.random() * 0.6,
        orbitSpeed:
          (0.08 + Math.random() * 0.3) * (Math.random() < 0.5 ? 1 : -1),
        orbitPhase: Math.random() * Math.PI * 2,
        driftAngle: Math.random() * Math.PI * 2,
        baseDriftSpeed: 0.0005 + Math.random() * 0.002,
        driftChangeRate: 0.001 + Math.random() * 0.003,
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
        targetR: col[0],
        targetG: col[1],
        targetB: col[2],
        targetAlpha: brightness,
        size,
      })

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2
      colors[i * 3] = col[0]
      colors[i * 3 + 1] = col[1]
      colors[i * 3 + 2] = col[2]
      scales[i] = size
    }
    particles.current = parts
  }

  // Detect theme change and assign new targets
  if (theme !== prevThemeRef.current) {
    prevThemeRef.current = theme
    for (const p of particles.current) {
      const col = pickColor(theme)
      p.targetR = col[0]
      p.targetG = col[1]
      p.targetB = col[2]
      p.targetAlpha = pickBrightness(theme)
    }
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta * 60, 3)
    timeRef.current += 0.004 * dt
    const t = timeRef.current
    const cursor = cursorRef.current
    const phys = physicsRef.current

    cursor.idleTime += delta

    // Lerp global physics toward current theme targets
    phys.drift += (theme.driftMultiplier - phys.drift) * LERP_SPEED * dt
    phys.orbit += (theme.orbitMultiplier - phys.orbit) * LERP_SPEED * dt
    phys.damping += (theme.damping - phys.damping) * LERP_SPEED * dt
    opacityRef.current += (theme.opacity - opacityRef.current) * LERP_SPEED * dt

    for (const c of clusters.current) {
      c.phase += c.orbitSpeed * delta
      c.x = c.cx + Math.cos(c.phase) * c.orbitRadius
      c.y = c.cy + Math.sin(c.phase) * c.orbitRadius
    }

    const cx = cursor.world.x
    const cy = cursor.world.y

    for (let i = 0; i < count; i++) {
      const p = particles.current[i]

      // Lerp particle colors toward targets
      p.r += (p.targetR - p.r) * LERP_SPEED * dt
      p.g += (p.targetG - p.g) * LERP_SPEED * dt
      p.b += (p.targetB - p.b) * LERP_SPEED * dt
      p.baseAlpha += (p.targetAlpha - p.baseAlpha) * LERP_SPEED * dt

      p.orbitPhase += p.orbitSpeed * phys.orbit * delta
      const orbX = Math.cos(p.orbitPhase) * p.orbitDist
      const orbY = Math.sin(p.orbitPhase) * p.orbitDist

      p.driftAngle += Math.sin(t * 2 + i * 0.01) * p.driftChangeRate * delta
      p.orbitCenterX += Math.cos(p.driftAngle) * p.baseDriftSpeed * phys.drift * dt
      p.orbitCenterY += Math.sin(p.driftAngle) * p.baseDriftSpeed * phys.drift * dt

      if (p.clusterIdx >= 0) {
        const c = clusters.current[p.clusterIdx]
        p.orbitCenterX += (c.x + (p.homeX - c.cx) - p.orbitCenterX) * 0.003 * dt
        p.orbitCenterY += (c.y + (p.homeY - c.cy) - p.orbitCenterY) * 0.003 * dt
      } else {
        if (p.orbitCenterX < -12) p.orbitCenterX = 12
        if (p.orbitCenterX > 12) p.orbitCenterX = -12
        if (p.orbitCenterY < -8) p.orbitCenterY = 8
        if (p.orbitCenterY > 8) p.orbitCenterY = -8
      }

      const targetX = p.orbitCenterX + orbX
      const targetY = p.orbitCenterY + orbY

      p.vx += (targetX - positions[i * 3]) * 0.02 * dt
      p.vy += (targetY - positions[i * 3 + 1]) * 0.02 * dt

      if (cursor.active) {
        const dx = positions[i * 3] - cx
        const dy = positions[i * 3 + 1] - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const radius = interactionRadius

        if (dist < radius) {
          const force = (1 - dist / radius) * 0.025 * p.depth
          const angle = Math.atan2(dy, dx)
          const swirlDir = i % 2 === 0 ? 1 : -1

          p.vx += Math.cos(angle) * force * 0.4 * dt
          p.vy += Math.sin(angle) * force * 0.4 * dt
          p.vx += Math.cos(angle + Math.PI * 0.5 * swirlDir) * force * 0.15 * dt
          p.vy += Math.sin(angle + Math.PI * 0.5 * swirlDir) * force * 0.15 * dt

          const alpha = Math.min(1, p.baseAlpha + (1 - dist / radius) * 0.5)
          colors[i * 3] = p.r * (0.5 + alpha * 0.5)
          colors[i * 3 + 1] = p.g * (0.5 + alpha * 0.5)
          colors[i * 3 + 2] = p.b * (0.5 + alpha * 0.5)
          scales[i] = p.size * (1 + (1 - dist / radius) * 0.3)
        } else {
          const fadeAlpha = p.baseAlpha
          colors[i * 3] = p.r * (0.5 + fadeAlpha * 0.5)
          colors[i * 3 + 1] = p.g * (0.5 + fadeAlpha * 0.5)
          colors[i * 3 + 2] = p.b * (0.5 + fadeAlpha * 0.5)
          scales[i] = p.size
        }

        if (cursor.idleTime > 5 && dist < radius * 2) {
          p.vx -= dx * 0.0003 * dt
          p.vy -= dy * 0.0003 * dt
        }
      }

      const damp = Math.pow(phys.damping, dt)
      p.vx *= damp
      p.vy *= damp

      positions[i * 3] += p.vx * dt
      positions[i * 3 + 1] += p.vy * dt
    }
  })

  return { positions, colors, scales, count, opacityRef }
}
