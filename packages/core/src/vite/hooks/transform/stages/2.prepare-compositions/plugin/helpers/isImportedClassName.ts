import type { NodePath, types } from "@babel/core";

export function isImportedClassName(path: NodePath<types.Identifier>): boolean {
  const name = path.node.name;
  const binding = path.scope.getBinding(name);
  if (!binding) {
    return false;
  }
  const importDec = binding.path.parentPath;
  return importDec?.isImportDeclaration() ?? false;
}
