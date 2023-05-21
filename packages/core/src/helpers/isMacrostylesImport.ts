import type { NodePath, types } from '@babel/core';

export function isMacrostylesImport(
  path: NodePath<types.Node>
): path is NodePath<types.ImportDeclaration> {
  if (!path.isImportDeclaration()) {
    return false;
  }
  const importSource = path.get('source');
  if (!importSource.isStringLiteral()) {
    return false;
  }
  return importSource.node.value === '@macrostyles/core';
}
