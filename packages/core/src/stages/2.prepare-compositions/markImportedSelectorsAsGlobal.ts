import type { NodePath } from '@babel/core';
import { types } from '@babel/core';

import { isImportedClassName } from './isImportedClassName';

export type Options = {
  temporalVariableNames: string[];
};

export function markImportedSelectorsAsGlobal({
  templateLiteralPath,
}: {
  templateLiteralPath: NodePath<types.TemplateLiteral>;
}): void {
  const expressions = templateLiteralPath.get('expressions');
  const quasis = templateLiteralPath.get('quasis');
  for (const [i, quasi] of quasis.entries()) {
    const expression = expressions.at(i);
    if (!expression?.isIdentifier()) {
      continue;
    }
    if (!quasi.node.value.raw.endsWith('.')) {
      continue;
    }
    if (!isImportedClassName(expression)) {
      continue;
    }
    const globalOpen = `${quasi.node.value.raw.slice(0, -1)}:global(.`;
    quasi.replaceWith(types.templateElement({ raw: globalOpen }));
    const nextLiteral = quasis.at(i + 1);
    if (!nextLiteral) {
      throw new Error('Failed');
    }
    const globalClose = `)${nextLiteral.node.value.raw}`;
    nextLiteral.replaceWith(types.templateElement({ raw: globalClose }));
  }
}
