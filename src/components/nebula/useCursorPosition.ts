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
