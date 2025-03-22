import { resolve } from "node:path";
import { ensureDir, writeJson } from "fs-extra";
import {
  author,
  bugs,
  description,
  engines,
  exports,
  homepage,
  license,
  name,
  repository,
  type,
  types,
  version,
} from "../../package.json";

async function main() {
  const dist = resolve("./dist/");
  await ensureDir(dist);
  const packagePath = resolve(dist, "package.json");
  const { default: defaultExport, types: typesExport } = exports["."];
  const { default: loadersDefaultExport, types: loadersTypesExport } =
    exports["./loaders"];

  const fixedTypes = types.replace("dist/", "");

  const fixedPackage = {
    author,
    bugs,
    description,
    engines,
    exports: {
      ".": {
        types: typesExport.replace("dist/", ""),
        default: defaultExport.replace("dist/", ""),
      },
      "./loaders": {
        types: loadersTypesExport.replace("dist/", ""),
        default: loadersDefaultExport.replace("dist/", ""),
      },
      "./package.json": exports["./package.json"],
    },
    homepage,
    license,
    name,
    repository,
    type,
    types: fixedTypes,
    version,
  };
  await writeJson(packagePath, fixedPackage);
}

await main();
