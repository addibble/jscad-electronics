import { expect, test } from "bun:test"
import * as jscad from "@jscad/modeling"
import { getJscadModelForFootprint } from "../lib/vanilla"

test("all assembly hardware families dispatch to physical colored solids", () => {
  for (const [model, color] of [
    ["screw_m3_l8_socketcap", [0.75, 0.78, 0.82, 1]],
    ["bolt_m3_l12_socketcap", [0.24, 0.25, 0.28, 1]],
    ["heatsetinsert_m3_l5.7", [0.78, 0.6, 0.2, 1]],
    ["spacer_od6_id3.2_l4", [0.75, 0.78, 0.82, 1]],
  ] as const) {
    const { geometries } = getJscadModelForFootprint(model, jscad)
    expect(geometries).toHaveLength(1)
    expect(geometries[0]!.color).toEqual([...color])
    expect(
      jscad.measurements.measureVolume(geometries[0]!.geom),
    ).toBeGreaterThan(0)
  }
  expect(() => getJscadModelForFootprint("screw_m9_l8", jscad)).toThrow()
})
