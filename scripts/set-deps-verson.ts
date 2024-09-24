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
    await readdir(packagesDir, {
      recursive: false,
      encoding: "ascii",
    })
  ).filter((x) => x !== packageName);

  const examplesDir = resolve("./examples");
  const targetExamples = await readdir(examplesDir, {
    recursive: false,
    encoding: "ascii",
  });

  const packagePrefix = "@casablanca-css/";

  for (const targetName of targetPackages) {
    const packageJsonPath = resolve(packagesDir, targetName, "package.json");

    const packageJson = await readJson(packageJsonPath);
    for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
      if (!(key in packageJson)) {
        continue;
      }
      packageJson[key][`${packagePrefix}${packageName}`] &&= `^${version}`;
    }
    await writeJSON(packageJsonPath, packageJson);
  }

  for (const targetName of targetExamples) {
    const packageJsonPath = resolve(examplesDir, targetName, "package.json");

    const packageJson = await readJson(packageJsonPath);
    for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
      if (!(key in packageJson)) {
        continue;
      }
      packageJson[key][`${packagePrefix}${packageName}`] &&= `^${version}`;
    }
    await writeJSON(packageJsonPath, packageJson);
  }
}

await main();
