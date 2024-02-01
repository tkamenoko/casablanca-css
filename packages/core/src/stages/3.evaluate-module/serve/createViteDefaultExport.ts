import type { NodePath } from '@babel/core';
import { types } from '@babel/core';

export function createViteDefaultExport(
  path: NodePath<types.AssignmentExpression>,
): types.ExportDefaultDeclaration | undefined {
  const left = path.get('left');
  if (!left.isMemberExpression()) {
    return;
  }
  const o = left.get('object');
  if (!o.isIdentifier() || o.node.name !== '__vite_ssr_exports__') {
    return;
  }
  const p = left.get('property');
  if (!p.isIdentifier() || p.node.name !== 'default') {
    return;
  }

  const right = path.get('right');

  const exportDec = types.exportDefaultDeclaration(right.node);
  return exportDec;
}
