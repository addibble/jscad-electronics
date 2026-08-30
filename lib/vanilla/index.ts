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
  return { geometries: [{ geom: getAssemblyHardwareGeom(footprint, jscad) }] }
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
