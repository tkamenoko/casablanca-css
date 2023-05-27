import type { PluginObj, PluginPass } from '@babel/core';
import { transformSync } from '@babel/core';
import type babel from '@babel/core';
import { isTopLevelStatement } from 'src/helpers/isTopLevelStatement';

import type { PluginOption, VirtualModuleIdPrefix } from '../../types';

type VariableName = string;

type AssignStylesToCapturedVariablesArgs = {
  code: string;
  variableNames: string[];
  cssImportId: `${VirtualModuleIdPrefix}/${string}`;
  options?: PluginOption;
};
type AssignStylesToCapturedVariablesReturn = {
  transformed: string;
};

type Options = {
  variableNames: string[];
  cssImportId: `${VirtualModuleIdPrefix}/${string}`;
};

type BabelState = {
  opts: Options;
  importIdName: string;
};

function assignStylesPlugin({
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
              t.stringLiteral(cssImportId)
            )
          );
        },
      },
      VariableDeclaration: {
        enter: (path, state) => {
          if (!isTopLevelStatement(path)) {
            return;
          }
          const { variableNames } = state.opts;
          const stylesId = t.identifier(state.importIdName);
          for (const declaration of path.get('declarations')) {
            const id = declaration.get('id');
            if (!id.isIdentifier()) {
              continue;
            }
            const name = id.node.name;
            if (variableNames.includes(name)) {
              declaration
                .get('init')
                .replaceWith(
                  t.memberExpression(stylesId, t.stringLiteral(name), true)
                );
            }
          }
        },
      },
    },
  };
}

export function assignStylesToCapturedVariables({
  code,
  cssImportId,
  variableNames,
  options,
}: AssignStylesToCapturedVariablesArgs): AssignStylesToCapturedVariablesReturn {
  const { babelOptions } = options ?? {};
  const pluginOption: Options = { cssImportId, variableNames };
  const result = transformSync(code, {
    ...babelOptions,
    plugins: [[assignStylesPlugin, pluginOption]],
  });
  if (!result) {
    throw new Error('Failed');
  }
  const { code: transformed } = result;
  if (!transformed) {
    throw new Error('Failed');
  }
  return {
    transformed,
  };
}
