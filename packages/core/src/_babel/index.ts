import type { PluginObj, PluginPass, TransformOptions } from '@babel/core';
import { transformAsync, types as t } from '@babel/core';
import type { VirtualModuleIdPrefix } from 'src/types';

import { generateCssFromIds } from '../helpers/generateCssFromIds';
import { isMacrostylesImport } from '../helpers/isMacrostylesImport';

import type { EvaluatedStyle } from './types';

type BabelMacrostylesPluginOptions = {
  cssLookup: Map<string, string>;
  fileName: string;
};

type BabelState = {
  tagIds?: string[];
};

export function babelMacrostylesPlugin(
  options: BabelMacrostylesPluginOptions
): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        enter: (path, state) => {
          const found = path.get('body').find(isMacrostylesImport);

          if (!found) {
            path.stop();
          }
        },
        exit: (path, state) => {
          if (!state.tagIds?.length) {
            return;
          }
          const cssStyles = new Map<string, EvaluatedStyle>();
          // evaluate!
          // TODO!
          if (!cssStyles.size) {
            return;
          }

          // append css importing
          // TODO: generate filename for css
          const importingSource: `${VirtualModuleIdPrefix}/${string}` = `virtual:macrostyles/${state.filename}`;
          const generatedCss = generateCssFromIds(cssStyles);
          options.cssLookup.set(importingSource, generatedCss);
          path.insertBefore(
            t.importDeclaration([], t.stringLiteral(importingSource))
          );

          // remove tags importing
          path.traverse({
            ImportDeclaration: {
              enter: (p, s) => {
                if (!isMacrostylesImport(p)) {
                  return;
                }

                for (const item of p.get('specifiers')) {
                  if (!t.isImportSpecifier(item.node)) {
                    continue;
                  }
                  const imported = item.get('imported');
                  if (
                    !Array.isArray(imported) &&
                    t.isIdentifier(imported.node)
                  ) {
                    const importedName = imported.node.name;
                    if (importedName === 'css') {
                      item.remove();
                    }
                  }
                }
              },
              exit: (path, state) => {
                if (!isMacrostylesImport(path)) {
                  return;
                }
                if (!path.get('specifiers').length) {
                  path.remove();
                }
              },
            },
          });
        },
      },
      VariableDeclaration: {
        enter: (path, state) => {
          // TODO!
          // if not toplevel, return
          // initializer is macrostyles tag?
          // capture variable name
        },
      },
    },
  };
}

type TransformReturn = {
  transformed: string;
  css?: string;
};

type Options = BabelMacrostylesPluginOptions & {
  babelOptions: TransformOptions;
};

export async function transform(
  code: string,
  options: Options
): Promise<TransformReturn> {
  const { babelOptions, ...pluginOptions } = options;
  const result = await transformAsync(code, {
    plugins: [[babelMacrostylesPlugin, pluginOptions]],
    ...babelOptions,
  });
  if (!result) {
    throw new Error('ERROR!');
  }
  const { code: transformed } = result;
  if (!transformed) {
    throw new Error('ERROR!');
  }
  return { transformed };
}
