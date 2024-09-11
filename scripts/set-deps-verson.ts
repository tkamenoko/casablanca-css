import { resolve } from "node:path";
import { argv } from "node:process";
import { readJson, readdir, writeJSON } from "fs-extra";

async function main() {
  const [, , packageName, version] = argv;
  if (!(packageName && version)) {
    throw new Error(`Invalid input: ${argv}`);
  }
  const packagesDir = resolve("./packages");
  const targetPackages = (
    await readdir(resolve("./packages"), {
      recursive: false,
      encoding: "ascii",
    })
  ).filter((x) => x !== packageName);

  const packagePrefix = "@casablanca/";

  for (const targetName of targetPackages) {
    const packageJsonPath = resolve(packagesDir, targetName, "package.json");

    const packageJson = await readJson(packageJsonPath);
    for (const key of ["dependencies", "peerDependencies"]) {
      if (!(key in packageJson)) {
        continue;
      }
      packageJson[key][`${packagePrefix}${packageName}`] &&= `^${version}`;
    }
    await writeJSON(packageJsonPath, packageJson);
  }
}

await main();
