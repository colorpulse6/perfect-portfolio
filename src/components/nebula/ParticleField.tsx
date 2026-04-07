import React, { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useParticlePhysics } from "./useParticlePhysics"
import { ParticleTheme } from "./particleThemes"

interface ParticleFieldProps {
  cursorRef: React.MutableRefObject<{
    world: THREE.Vector3
    speed: number
    idleTime: number
    active: boolean
  }>
  count?: number
  theme: ParticleTheme
}

function createParticleTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  const half = size / 2
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
  gradient.addColorStop(0, "rgba(255,255,255,0.9)")
  gradient.addColorStop(0.12, "rgba(255,255,255,0.35)")
  gradient.addColorStop(0.35, "rgba(255,255,255,0.08)")
  gradient.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

const ParticleField: React.FC<ParticleFieldProps> = ({
  cursorRef,
  count = 900,
  theme,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const dummy = useRef(new THREE.Object3D())
  const tempColor = useRef(new THREE.Color())

  const texture = useMemo(() => {
    if (typeof document === "undefined") return null
    return createParticleTexture()
  }, [])

  const { positions, colors, scales, opacityRef } = useParticlePhysics(
    {
      count,
      clusterCount: 7,
      interactionRadius: 1.5,
      theme,
    },
    cursorRef
  )

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    if (matRef.current) {
      matRef.current.opacity = opacityRef.current
    }

    for (let i = 0; i < count; i++) {
      dummy.current.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      )
      dummy.current.scale.setScalar(scales[i] * 3)
      dummy.current.updateMatrix()
      mesh.setMatrixAt(i, dummy.current.matrix)
      tempColor.current.setRGB(
        colors[i * 3],
        colors[i * 3 + 1],
        colors[i * 3 + 2]
      )
      mesh.setColorAt(i, tempColor.current)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        transparent
        opacity={0.45}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={texture}
      />
    </instancedMesh>
  )
}

export default ParticleField
