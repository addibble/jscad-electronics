import {
  getAssemblyHardwareGeom,
  isAssemblyHardwareString,
} from "@tscircuit/jscad-assembly-hardware"
import { ExtrudedPads } from "../ExtrudedPads"
import { Footprinter3d } from "../Footprinter3d"
import { Fragment, type VNode, h } from "./h"
import { type ColoredGeom, type RenderResult, render } from "./render"
export * from "./convertCSGToThreeGeom"
import type * as jscadModeling from "@jscad/modeling"

export { h, Fragment }
export type { VNode, RenderResult, ColoredGeom }

/**
 * Assembly hardware -- screws, bolts, heat-set inserts, spacers.
 *
 * These come in as modelprinter strings like any other model string, and are
 * built straight to geometry rather than through the fiber tree: they are
 * generated solids with no props to spread and no children, so a component
 * wrapper would only add a hop.
 *
 * Handled here rather than in `Footprinter3d` so it applies to every caller of
 * `getJscadModelForFootprint` at once -- which is both renderers, since
 * 3d-viewer and circuit-json-to-gltf share this entry point.
 */
const tryAssemblyHardware = (
  footprint: string,
  jscad: typeof jscadModeling,
): RenderResult | null => {
  if (!isAssemblyHardwareString(footprint)) return null
  const geom = getAssemblyHardwareGeom(footprint, jscad)
  // The part states its own material with a `colorize` in its plan, and jscad
  // leaves that on the geometry. Lift it onto the ColoredGeom so it reaches the
  // renderer -- otherwise the colour is present in the solid and invisible to
  // everything downstream, and hardware silently takes the scene's fallback.
  const color = (geom as { color?: [number, number, number, number] }).color
  return { geometries: [{ geom, ...(color ? { color } : {}) }] }
}

export function getJscadModelForFootprint(
  footprint: string,
  jscad: typeof jscadModeling,
): RenderResult {
  const hardware = tryAssemblyHardware(footprint, jscad)
  if (hardware) return hardware
  const vnode = h(Footprinter3d, { footprint })
  return render(vnode, jscad)
}

export function getJscadModelForFootprintWithPads(
  footprint: string,
  jscad: typeof jscadModeling,
): RenderResult {
  const vnode = h(
    Fragment,
    {},
    h(Footprinter3d, { footprint }),
    h(ExtrudedPads, { footprint }),
  )
  return render(vnode, jscad)
}

export function createJSCADRenderer(jscad: typeof jscadModeling) {
  function createJSCADRoot(container: ColoredGeom[]) {
    return {
      render(element: VNode) {
        const { geometries } = render(element, jscad)
        container.splice(0, container.length, ...geometries)
      },
    }
  }

  return { createJSCADRoot }
}
