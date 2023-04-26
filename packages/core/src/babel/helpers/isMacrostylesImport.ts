import type { NodePath } from '@babel/core';
import { types } from '@babel/core';

export function isMacrostylesImport(
  path: NodePath<types.Node>
): path is NodePath<types.ImportDeclaration> {
  if (!types.isImportDeclaration(path.node)) {
    return false;
  }
  const importSource = path.get('source');
  if (
    Array.isArray(importSource) ||
    !types.isStringLiteral(importSource.node)
  ) {
    return false;
  }
  return importSource.node.value === '@macrostyles/core';
}
