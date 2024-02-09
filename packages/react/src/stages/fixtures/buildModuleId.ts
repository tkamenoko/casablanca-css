import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePath } from "vite";

export function buildModuleId({
  relativePath,
  root,
}: {
  relativePath: `./${string}`;
  root: string;
}): string {
  const rootWithoutTail = root.split("/").slice(0, -1).join("/");
  const rootDir = rootWithoutTail.endsWith("/")
    ? rootWithoutTail
    : `${rootWithoutTail}/`;
  const path = normalizePath(resolve(fileURLToPath(rootDir), relativePath));

  return path;
}
