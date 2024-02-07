import type { NodePath, PluginObj, PluginPass, types } from '@babel/core';
import type babel from '@babel/core';
import {
  isMacrostylesCssTemplate,
  isMacrostylesImport,
} from '@macrostyles/utils';

import { isImportedComponent } from './isImportedComponent';

export function modifyCompositionsPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass> {
  return {
    visitor: {
      Program: {
        enter: (path) => {
          const found = path
            .get('body')
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isMacrostylesImport(p, 'core'),
            );
          if (!found) {
            path.stop();
            return;
          }
        },
      },
      TaggedTemplateExpression: {
        enter: (path) => {
          // is macrostyles template?
          if (!isMacrostylesCssTemplate(path, 'css')) {
            return;
          }
          const quasi = path.get('quasi');
          const quasis = quasi.get('quasis');
          const expressions = quasi.get('expressions');
          for (const [index, literal] of quasis.entries()) {
            const expression = expressions.at(index);
            if (!expression?.isIdentifier()) {
              continue;
            }
            if (!literal.node.value.raw.endsWith('.')) {
              continue;
            }
            // replace `.${Component}` selector with className
            const componentId = expression.node;
            if (isImportedComponent(expression)) {
              const globalOpen = `${literal.node.value.raw.slice(
                0,
                -1,
              )}:global(.`;
              literal.replaceWith(t.templateElement({ raw: globalOpen }));
              const nextLiteral = quasis.at(index + 1);
              if (!nextLiteral) {
                throw new Error('Failed');
              }
              const globalClose = `)${nextLiteral.node.value.raw}`;
              nextLiteral.replaceWith(t.templateElement({ raw: globalClose }));
              expression.replaceWith(
                t.memberExpression(
                  componentId,
                  t.identifier('__modularizedClassName'),
                ),
              );
            } else {
              expression.replaceWith(
                t.memberExpression(componentId, t.identifier('__rawClassName')),
              );
            }
          }
        },
      },
    },
  };
}
