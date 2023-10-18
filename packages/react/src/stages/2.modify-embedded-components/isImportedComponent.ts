import type { NodePath, types } from '@babel/core';

export function isImportedComponent(path: NodePath<types.Identifier>): boolean {
  const name = path.node.name;
  if (!name.at(0)?.match(/[A-Z]/)) {
    return false;
  }
  const binding = path.scope.getBinding(name);
  if (!binding) {
    return false;
  }
  const importDec = binding.path.parentPath;
  return importDec?.isImportDeclaration() ?? false;
}
