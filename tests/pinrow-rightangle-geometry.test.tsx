import { expect, test } from "bun:test"
import { PinHeader } from "../lib/PinHeader"

test("inverted through-hole right-angle header connects a downward tail to a horizontal pin", () => {
  const element = PinHeader({
    x: 0,
    y: 0,
    pinThickness: 0.63,
    shortSidePinLength: 3,
    longSidePinLength: 6,
    bodyHeight: 2,
    flipZ: (z) => -z + 2,
    rightangle: true,
    invert: true,
  }) as any

  const [body, conductors] = element.props.children
  const [tail, horizontal] = conductors.props.children

  expect(body.props.center).toEqual([0, -3, 1])
  expect(tail.props.center).toEqual([0, 0, -0.5])
  expect(tail.props.size).toEqual([0.63, 0.63, 3])
  expect(horizontal.props.center).toEqual([0, -3, 1])
  expect(horizontal.props.size).toEqual([0.63, 6, 0.63])
})
