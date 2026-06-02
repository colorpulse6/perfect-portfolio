import React from "react"
import { useSpring, animated as animatedWeb } from "react-spring"

// react-spring v8's `animated` host-element types collide with the three.js
// variant present in this project (via @react-three/fiber); the web runtime is
// correct, so type the helper loosely.
const animated: any = animatedWeb

interface SpringProps {
  /** Title elements get a gentler parallax tilt. */
  isTitle?: boolean
  children: React.ReactNode
}

const Spring: React.FC<SpringProps> = ({ isTitle, children }) => {
  // Parallax tilt: map cursor position to rotateX/rotateY + a slight scale.
  const calc = (x: number, y: number): number[] => [
    -(y - window.innerHeight / 2) / 20,
    (x - window.innerWidth / 2) / 20,
    1.1,
  ]
  const calcTitle = (x: number, y: number): number[] => [
    -(y - window.innerHeight / 2) / 40,
    (x - window.innerWidth / 2) / 50,
    1.1,
  ]
  const trans = (x: number, y: number, s: number): string =>
    `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`

  const [props, set] = useSpring(() => ({
    xys: [0, 0, 1],
    config: { mass: 5, tension: 350, friction: 40 },
  }))

  return (
    <animated.div
      onMouseMove={({ clientX: x, clientY: y }: React.MouseEvent) =>
        isTitle ? set({ xys: calcTitle(x, y) }) : set({ xys: calc(x, y) })
      }
      onMouseLeave={() => set({ xys: [0, 0, 1] })}
      style={{ transform: (props.xys as any).interpolate(trans) }}
    >
      {children}
    </animated.div>
  )
}

export default Spring
