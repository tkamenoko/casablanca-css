import type { PluginObj, PluginPass } from '@babel/core';
import type babel from '@babel/core';

import { isTopLevelStatement } from '@/stages/helpers/isTopLevelStatement';
import type { ModuleIdPrefix } from '@/types';

import type { CapturedVariableNames } from '../1.capture-tagged-styles';

export type Options = {
  temporalVariableNames: CapturedVariableNames;
  originalToTemporalMap: CapturedVariableNames;
  cssImportId: `${ModuleIdPrefix}${string}`;
};

type BabelState = {
  opts: Options;
  importIdName: string;
};

export function assignStylesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        enter: (path, state) => {
          const stylesId = path.scope.generateUidIdentifier('styles');
          state.importIdName = stylesId.name;
          const { cssImportId } = state.opts;
          const head = path.get('body').at(0);
          if (!head) {
            throw new Error('Blank file?');
          }
          head.insertBefore(
            t.importDeclaration(
              [t.importDefaultSpecifier(stylesId)],
              t.stringLiteral(cssImportId),
            ),
          );
        },
      },

      VariableDeclaration: {
        enter: (path, state) => {
          if (!isTopLevelStatement(path)) {
            return;
          }
          const { temporalVariableNames, originalToTemporalMap } = state.opts;
          const stylesId = t.identifier(state.importIdName);
          for (const declaration of path.get('declarations')) {
            const id = declaration.get('id');
            if (!id.isIdentifier()) {
              continue;
            }
            const name = id.node.name;
            const removeTarget = temporalVariableNames.get(name);
            if (removeTarget && path.parentPath.isExportNamedDeclaration()) {
              path.parentPath.remove();
              return;
            }
            const replaceTarget = originalToTemporalMap.get(name);
            if (replaceTarget) {
              declaration
                .get('init')
                .replaceWith(
                  t.memberExpression(stylesId, t.stringLiteral(name), true),
                );
            }
          }
        },
      },
    },
  };
}