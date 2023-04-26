import type { NodePath } from '@babel/core';
import { types } from '@babel/core';

export function isTopLevelStatement(path: NodePath): boolean {
  return types.isProgram(path.parent) || types.isExportDeclaration(path.parent);
}
