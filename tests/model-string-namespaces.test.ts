import { getFootprintNames } from "@tscircuit/footprinter"
import { ASSEMBLY_HARDWARE_FAMILIES } from "@tscircuit/jscad-assembly-hardware"
import { mp } from "@tscircuit/modelprinter"
import { expect, test } from "bun:test"
import { getJscadModelForFootprint } from "../lib/vanilla"

/**
 * Circuit JSON carries one string field for "a model named by a string", and
 * `getJscadModelForFootprint` decides what it means by trying the modelprinter
 * vocabulary before falling through to footprinter. That is only sound while
 * the two vocabularies are disjoint: the moment a name exists in both, dispatch
 * order silently decides, and a PCB part would be served a screw.
 *
 * Both vocabularies are closed, enumerable registries, so this is checkable
 * rather than merely hoped for. These tests are the guard that lets one field
 * carry two grammars -- if one ever fails, that is the signal to give Circuit
 * JSON an explicit provider field, not to renegotiate the dispatch order.
 */

const footprinterNames = new Set<string>(getFootprintNames())
const modelprinterNames = new Set<string>(mp.getModelNames())

test("no name belongs to both the footprinter and modelprinter vocabularies", () => {
  const shared = [...modelprinterNames].filter((n) => footprinterNames.has(n))
  expect(shared).toEqual([])
})

test("every assembly hardware family is a modelprinter family", () => {
  // Hardware is dispatched by family name, so a family the parser does not
  // know would be unreachable -- and, worse, would fall through to footprinter
  // and be reported as an unknown footprint rather than a bad hardware string.
  for (const family of ASSEMBLY_HARDWARE_FAMILIES) {
    expect(modelprinterNames.has(family)).toBe(true)
  }
})

test("no assembly hardware family collides with a footprint name", () => {
  for (const family of ASSEMBLY_HARDWARE_FAMILIES) {
    expect(footprinterNames.has(family)).toBe(false)
  }
})

/**
 * The registries being disjoint is the invariant; this checks the dispatcher
 * actually honours it, since a collision-free namespace still would not help if
 * the hardware branch claimed strings by prefix or by a loose parse.
 */
test("the dispatcher sends every footprint name down the footprinter path", () => {
  // A representative spread rather than all of them: the point is that names
  // which merely start with, or read like, a hardware family are not captured.
  const suspicious = [...footprinterNames].filter((n) =>
    [...ASSEMBLY_HARDWARE_FAMILIES].some(
      (f) => n.startsWith(f[0]!) || n.includes(f.slice(0, 3)),
    ),
  )
  for (const name of [...suspicious.slice(0, 40), "0402", "dip8", "soic8"]) {
    // Not a hardware string, so it must not be built as one. Building it as a
    // footprint may still fail for unrelated reasons; what matters is which
    // branch claimed it.
    let claimedAsHardware = true
    try {
      getJscadModelForFootprint(name, {} as never)
      // an empty jscad instance cannot build a real solid, so reaching here
      // means the footprinter path ran and produced nothing
      claimedAsHardware = false
    } catch (e) {
      // hardware construction dereferences the jscad instance we did not
      // supply; footprinter rendering fails differently or not at all
      claimedAsHardware = /is not a function|undefined/.test(String(e))
    }
    if (claimedAsHardware) {
      throw new Error(`footprint "${name}" was claimed by the hardware branch`)
    }
  }
})
