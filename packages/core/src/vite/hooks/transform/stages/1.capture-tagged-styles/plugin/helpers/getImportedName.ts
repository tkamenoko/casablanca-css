import type { NodePath, types } from "@babel/core";

export function getImportedName(
  item: NodePath<
    | types.ImportDefaultSpecifier
    | types.ImportNamespaceSpecifier
    | types.ImportSpecifier
  >,
): string | null {
  if (!item.isImportSpecifier()) {
    return null;
  }
  const imported = item.get("imported");
  if (!imported.isIdentifier()) {
    return null;
  }
  const importedName = imported.node.name;
  return importedName;
}
