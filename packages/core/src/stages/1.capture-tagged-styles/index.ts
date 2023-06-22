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

type CaptureTaggedStylesReturn = {
  transformed: string;
  capturedVariableNames: string[];
};

type Options = { capturedVariableNames: string[] };

type BabelState = {
  opts: Options;
};

function captureVariableNamesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        enter: (path) => {
          const found = path.get('body').find(isMacrostylesImport);

          if (!found) {
            path.stop();
          }
        },
        exit: (path, state) => {
          if (!state.opts.capturedVariableNames.length) {
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
            state.opts.capturedVariableNames.push(name);
            init.replaceWith(init.get('quasi').node);

            if (!path.parentPath.isExportNamedDeclaration()) {
              path.replaceWith(t.exportNamedDeclaration(path.node));
            }
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
  const pluginOption: Options = { capturedVariableNames: [] };
  const result = transformSync(code, {
    ...babelOptions,
    plugins: [[captureVariableNamesPlugin, pluginOption]],
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
