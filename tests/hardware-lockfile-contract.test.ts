import { expect, test } from "bun:test"

test("frozen installs include the declared hardware dependency", async () => {
  const manifest = await Bun.file(
    new URL("../package.json", import.meta.url),
  ).json()
  const lock = Bun.JSONC.parse(
    await Bun.file(new URL("../bun.lock", import.meta.url)).text(),
  )
  const name = "@tscircuit/jscad-assembly-hardware"

  expect(lock.workspaces[""].dependencies[name]).toBe(
    manifest.dependencies[name],
  )
  expect(lock.packages).toHaveProperty(name)
})
