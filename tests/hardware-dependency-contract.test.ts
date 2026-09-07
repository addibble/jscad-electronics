import { expect, test } from "bun:test"

test("hardware dispatch excludes the parser published before hardware support", async () => {
  const manifest = await Bun.file(
    new URL("../package.json", import.meta.url),
  ).json()
  const range = manifest.dependencies["@tscircuit/modelprinter"]

  expect(range).toBeString()
  // Modelprinter 0.0.2 cannot parse the hardware families dispatched by vanilla.
  expect(Bun.semver.satisfies("0.0.2", range)).toBe(false)
})
