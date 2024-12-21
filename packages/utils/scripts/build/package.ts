import { resolve } from "node:path";
import { ensureDir, writeJson } from "fs-extra";
import {
  author,
  bugs,
  dependencies,
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
  const fixedTypes = types.replace("dist/", "");

  const fixedPackage = {
    author,
    bugs,
    dependencies,
    description,
    engines,
    exports: {
      ".": {
        types: typesExport.replace("dist/", ""),
        default: defaultExport.replace("dist/", ""),
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
