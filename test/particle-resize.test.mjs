import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

// Preserve hook state between renders and exercise the real animation callback
// without requiring a WebGL context in Node.
function createPhysicsHarness() {
  const slots = []
  let index = 0
  let frame
  const react = {
    useRef(value) {
      const slot = index++
      return (slots[slot] ??= { current: value })
    },
    useMemo(factory, deps) {
      const slot = index++
      if (!slots[slot] || deps.some((value, i) => value !== slots[slot].deps[i])) {
        slots[slot] = { value: factory(), deps }
      }
      return slots[slot].value
    },
  }
  const source = fs.readFileSync(new URL("../src/components/nebula/useParticlePhysics.ts", import.meta.url), "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const exports = {}
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "react") return react
      if (name === "@react-three/fiber") return { useFrame: callback => { frame = callback } }
      throw new Error(`Unexpected runtime dependency: ${name}`)
    },
  })
  const theme = { colors: [[0.4, 0.7, 0.9]], brightnessRange: [0.3, 0.8], opacity: 0.5, driftMultiplier: 1, orbitMultiplier: 1, damping: 0.95 }
  const cursor = { current: { world: { x: 0, y: 0 }, speed: 0, idleTime: 0, active: true } }
  return {
    render(count, clusterCount = 7) {
      index = 0
      return exports.useParticlePhysics({ count, clusterCount, interactionRadius: 1.5, theme }, cursor)
    },
    tick() { frame({}, 1 / 60) },
  }
}

test("particle buffers remain initialized and animate across repeated mobile/desktop count changes", () => {
  const physics = createPhysicsHarness()
  for (const count of [350, 900, 350, 900]) {
    const arrays = physics.render(count)
    assert.equal(arrays.positions.length, count * 3)
    assert.equal(arrays.colors.length, count * 3)
    assert.equal(arrays.scales.length, count)
    assert.doesNotThrow(() => physics.tick(), `frame after resize to ${count}`)
    assert.ok(arrays.positions.every(Number.isFinite))
    assert.ok(arrays.colors.every(value => Number.isFinite(value) && value > 0))
    assert.ok(arrays.scales.every(value => Number.isFinite(value) && value > 0))
    assert.equal(physics.render(count).positions, arrays.positions, "ordinary rerenders preserve buffers")
  }
})
