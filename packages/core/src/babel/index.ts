import type { PluginObj, PluginPass } from '@babel/core';
import { transformSync, types as t } from '@babel/core';
import type { VirtualModuleIdPrefix } from 'src/types';

import { generateMcssFromIds } from './helpers/generateMcssFromIds';
import { isMacrostylesImport } from './helpers/isMacrostylesImport';
import type { EvaluatedStyle } from './types';

type BabelMacrostylesPluginOptions = {
  mcssFiles: Map<string, string>;
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
          const mcssStyles = new Map<string, EvaluatedStyle>();
          // evaluate!
          // TODO!
          if (!mcssStyles.size) {
            return;
          }

          // append mcss importing
          const importSpecifierId = path.scope.generateUidIdentifier('styles');
          // TODO: generate filename for mcss
          const importingSource: `${VirtualModuleIdPrefix}/${string}` = `virtual:macrostyles/${state.filename}`;
          const generatedMcss = generateMcssFromIds(mcssStyles);
          options.mcssFiles.set(importingSource, generatedMcss);
          path.insertBefore(
            t.importDeclaration(
              [t.importDefaultSpecifier(importSpecifierId)],
              t.stringLiteral(importingSource)
            )
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
  code: string;
  mcss?: string;
};

export async function transform(
  code: string,
  options: {}
): Promise<TransformReturn> {
  transformSync(code, {
    plugins: [],
  });
  throw new Error('TODO!');
}
