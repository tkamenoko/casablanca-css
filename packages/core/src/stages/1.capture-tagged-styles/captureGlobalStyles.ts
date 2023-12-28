import type { PluginObj, PluginPass, types, NodePath } from '@babel/core';
import type babel from '@babel/core';
import {
  isMacrostylesImport,
  isTopLevelStatement,
  isMacrostylesCssTemplate,
} from '@macrostyles/utils';

import type { BabelState } from './types';

// TODO!

export function captureGlobalStylesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
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
      ExpressionStatement: {
        enter: (path, state) => {
          if (!isTopLevelStatement(path)) {
            return;
          }
          const exp = path.get('expression');
          if (!exp.isTaggedTemplateExpression()) {
            return;
          }
          // TODO!
          // create temp var
          // assign style
          // push to capturedGlobalStyleTempNames
        },
      },
    },
  };
}
