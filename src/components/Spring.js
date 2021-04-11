import React from "react"
import { useSpring, animated } from "react-spring"

const Spring = ({ isTitle, children }) => {
  //Spring Animation
  const calc = (x, y) => [
    -(y - window.innerHeight / 2) / 20,
    (x - window.innerWidth / 2) / 20,
    1.1,
  ]
  const calcTitle = (x, y) => [
    -(y - window.innerHeight / 2) / 40,
    (x - window.innerWidth / 2) / 50,
    1.1,
  ]
  const trans = (x, y, s) =>
    `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`

  const [props, set] = useSpring(() => ({
    xys: [0, 0, 1],
    config: { mass: 5, tension: 350, friction: 40 },
  }))

  return (
    <>
      <animated.div
        onMouseMove={({ clientX: x, clientY: y }) =>
          isTitle ? set({ xys: calcTitle(x, y) }) : set({ xys: calc(x, y) })
        }
        onMouseLeave={() => set({ xys: [0, 0, 1] })}
        style={{ transform: props.xys.interpolate(trans) }}
      >
        {children}
      </animated.div>
    </>
  )
}

export default Spring
