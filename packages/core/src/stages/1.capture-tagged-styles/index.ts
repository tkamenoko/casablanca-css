import type { PluginObj, PluginPass, TransformOptions } from '@babel/core';
import type babel from '@babel/core';
import { transformSync } from '@babel/core';
import { isMacrostylesCssTemplate } from 'src/helpers/isMacrostylesCssTemplate';
import { isMacrostylesImport } from 'src/helpers/isMacrostylesImport';
import { isTopLevelStatement } from 'src/helpers/isTopLevelStatement';

type CaptureTaggedStylesArgs = {
  code: string;
  options?: {
    babelOptions: TransformOptions;
  };
};

export type CapturedVariableNames = Map<
  string,
  { shouldRemoveExport: boolean }
>;

type CaptureTaggedStylesReturn = {
  transformed: string;
  capturedVariableNames: CapturedVariableNames;
};

type Options = {
  capturedVariableNames: CapturedVariableNames;
  exportedNames: string[];
};

type BabelState = {
  opts: Options;
};

function captureVariableNamesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        enter: (path, state) => {
          const found = path.get('body').find(isMacrostylesImport);

          if (!found) {
            path.stop();
          }
          // memory already-exported variables
          path.traverse(
            {
              ExportNamedDeclaration: {
                enter: (path, state) => {
                  const declaration = path.get('declaration');
                  if (declaration.isVariableDeclaration()) {
                    // export const xxx = ...
                    for (const v of declaration.get('declarations')) {
                      const id = v.get('id');
                      if (id.isIdentifier()) {
                        state.opts.exportedNames.push(id.node.name);
                      }
                    }
                    return;
                  }
                  const specifiers = path.get('specifiers');
                  for (const specifier of specifiers) {
                    // export { xxx as yyy, zzz, ...}
                    if (specifier.isExportSpecifier()) {
                      const id = specifier.get('exported');
                      if (id.isIdentifier()) {
                        state.opts.exportedNames.push(id.node.name);
                      }
                    }
                  }
                },
              },
            },
            state,
          );
        },
        exit: (path, state) => {
          if (!state.opts.capturedVariableNames.size) {
            return;
          }
          // remove tags importing
          path.traverse({
            ImportDeclaration: {
              enter: (p) => {
                if (!isMacrostylesImport(p)) {
                  return;
                }

                for (const item of p.get('specifiers')) {
                  if (!item.isImportSpecifier()) {
                    continue;
                  }
                  const imported = item.get('imported');
                  if (imported.isIdentifier()) {
                    const importedName = imported.node.name;
                    if (importedName === 'css') {
                      item.remove();
                    }
                  }
                }
              },
              exit: (path) => {
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
          if (!isTopLevelStatement(path)) {
            return;
          }
          for (const declaration of path.get('declarations')) {
            const init = declaration.get('init');

            if (!isMacrostylesCssTemplate(init)) {
              return;
            }
            const id = declaration.get('id');
            if (!id.isIdentifier()) {
              return;
            }
            const name = id.node.name;

            const captured = { name, shouldRemoveExport: false };

            init.replaceWith(init.get('quasi').node);

            if (
              !path.parentPath.isExportNamedDeclaration() &&
              !state.opts.exportedNames.includes(name)
            ) {
              path.replaceWith(t.exportNamedDeclaration(path.node));
              captured.shouldRemoveExport = true;
            }
            state.opts.capturedVariableNames.set(captured.name, {
              shouldRemoveExport: captured.shouldRemoveExport,
            });
          }
        },
      },
    },
  };
}

// find tagged templates, then remove all tags.
// enforce variables to export.
export function captureTaggedStyles({
  code,
  options,
}: CaptureTaggedStylesArgs): CaptureTaggedStylesReturn {
  const { babelOptions } = options ?? {};
  const pluginOption: Options = {
    capturedVariableNames: new Map(),
    exportedNames: [],
  };
  const result = transformSync(code, {
    ...babelOptions,
    plugins: [[captureVariableNamesPlugin, pluginOption]],
    sourceMaps: 'inline',
  });
  if (!result) {
    throw new Error('Failed');
  }
  const { code: transformed } = result;
  if (!transformed) {
    throw new Error('Failed');
  }
  return {
    capturedVariableNames: pluginOption.capturedVariableNames,
    transformed,
  };
}
