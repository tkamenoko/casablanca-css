import type { NodePath, types } from "@babel/core";
import { isCasablancaImport } from "@casablanca/utils";
import { getImportedName } from "./helpers/getImportedName";

const tagNames = new Set(["css", "injectGlobal"]);

export function removeImports(
  path: NodePath<types.ImportDeclaration>,
): boolean {
  if (!isCasablancaImport(path, "core")) {
    return false;
  }
  for (const item of path.get("specifiers")) {
    const importedName = getImportedName(item);
    if (importedName && tagNames.has(importedName)) {
      item.remove();
    }
  }
  if (!path.get("specifiers").length) {
    path.remove();
  }
  return true;
}
