import type { NodePath, types } from "@babel/core";

export function isCasablancaImport(
  path: NodePath<types.Node>,
  packageName: "core" | "styled" | "utils",
): path is NodePath<types.ImportDeclaration> {
  if (!path.isImportDeclaration()) {
    return false;
  }
  const importSource = path.get("source");
  if (!importSource.isStringLiteral()) {
    return false;
  }
  return importSource.node.value === `@casablanca-css/${packageName}`;
}
