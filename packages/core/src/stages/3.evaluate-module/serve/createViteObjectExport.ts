import { types } from '@babel/core';
import type { NodePath } from '@babel/core';

export function createViteObjectExport(
  path: NodePath<types.CallExpression>,
): [types.VariableDeclaration, types.ExportNamedDeclaration] | undefined {
  const callee = path.get('callee');
  if (!callee.isMemberExpression()) {
    return;
  }
  const o = callee.get('object');
  if (!o.isIdentifier() || o.node.name !== 'Object') {
    return;
  }
  const p = callee.get('property');
  if (!p.isIdentifier() || p.node.name !== 'defineProperty') {
    return;
  }
  const [viteExportsId, exportedAs, exportingObj] = path.get('arguments');
  if (
    !viteExportsId?.isIdentifier() ||
    viteExportsId.node.name !== '__vite_ssr_exports__'
  ) {
    return;
  }
  if (!exportedAs?.isStringLiteral()) {
    return;
  }
  if (!exportingObj?.isObjectExpression()) {
    return;
  }
  let exportLocal: NodePath<types.Expression> | null = null;
  for (const p of exportingObj.get('properties')) {
    if (!p.isObjectMethod()) {
      continue;
    }
    const key = p.get('key');
    if (!key.isIdentifier() || key.node.name !== 'get') {
      continue;
    }
    const block = p.get('body');
    const returning = block.get('body').at(0);
    if (!returning?.isReturnStatement()) {
      continue;
    }
    const returnContent = returning.get('argument');
    if (!returnContent.isExpression()) {
      continue;
    }
    exportLocal = returnContent;
    break;
  }
  if (!exportLocal) {
    return;
  }
  const tempId = path.scope.generateUidIdentifier();
  const varDec = types.variableDeclaration('const', [
    types.variableDeclarator(tempId, exportLocal.node),
  ]);
  const exportDec = types.exportNamedDeclaration(null, [
    types.exportSpecifier(tempId, exportedAs.node),
  ]);
  return [varDec, exportDec];
}
