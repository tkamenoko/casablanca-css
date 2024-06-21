import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  author,
  bugs,
  dependencies,
  description,
  exports,
  homepage,
  license,
  name,
  peerDependencies,
  repository,
  type,
  types,
  version,
} from "../../package.json";

async function main() {
  const dist = resolve("./dist/");
  const packagePath = resolve(dist, "package.json");
  const { default: defaultExport, types: typesExport } = exports["."];
  const fixedTypes = types.replace("dist/", "");

  const fixedPackage = {
    author,
    bugs,
    dependencies,
    description,
    exports: {
      ".": {
        types: typesExport.replace("dist/", ""),
        default: defaultExport.replace("dist/", ""),
      },
    },
    homepage,
    license,
    name,
    peerDependencies,
    repository,
    type,
    types: fixedTypes,
    version,
  };
  await writeFile(packagePath, JSON.stringify(fixedPackage));
}

await main();
