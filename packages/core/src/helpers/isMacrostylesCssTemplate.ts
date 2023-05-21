import type { NodePath, types } from '@babel/core';
import type { TaggedTemplateExpression } from '@babel/types';

import { isMacrostylesImport } from './isMacrostylesImport';

export function isMacrostylesCssTemplate(
  path: NodePath<types.Expression | null | undefined>
): path is NodePath<TaggedTemplateExpression> {
  if (!path.isTaggedTemplateExpression()) {
    return false;
  }
  const tagId = path.get('tag');
  if (!tagId.isIdentifier()) {
    return false;
  }
  const tagBinding = path.scope.getBinding(tagId.node.name);
  if (!tagBinding) {
    return false;
  }
  const importDec = tagBinding.path.parentPath;

  if (!(importDec && isMacrostylesImport(importDec))) {
    return false;
  }
  const imported = tagBinding.path.get('imported');

  if (Array.isArray(imported)) {
    return false;
  }

  if (!imported.isIdentifier()) {
    return false;
  }
  return imported.node.name === 'css';
}
