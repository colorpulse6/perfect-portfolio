import test from "node:test"
import assert from "node:assert/strict"
import { isScrollPath } from "../src/helpers/routes.ts"
import { SCENES, SCENE_COPY } from "../src/components/scroll/data/content.ts"

test("home uses the scroll layout and legacy links retain its redirect shell", () => {
  for (const path of ["/", "/scroll", "/scroll/"]) assert.equal(isScrollPath(path), true)
  for (const path of ["/atlas/", "/writing/", "/projects/", "/scrolling/"]) assert.equal(isScrollPath(path), false)
})

test("Atlas is the last home section and opens the full Atlas", () => {
  assert.equal(SCENES.at(-1)?.id, "atlas")
  assert.equal(SCENES.filter(scene => scene.id === "atlas").length, 1)
  assert.equal(SCENE_COPY.atlas.link, "/atlas/")
})
