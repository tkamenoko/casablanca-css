import type { PluginObj, PluginPass, types, NodePath } from '@babel/core';
import type babel from '@babel/core';
import {
  isMacrostylesImport,
  isTopLevelStatement,
  isMacrostylesCssTemplate,
} from '@macrostyles/utils';

export type CapturedVariableNames = Map<
  string,
  { originalName: string; temporalName: string; tagType: 'css' }
>;

export type ImportSource = {
  names: { className: string; localName: string }[];
  source: string;
};

export type Options = {
  capturedVariableNames: CapturedVariableNames;
  importSources: ImportSource[];
  exportedNames: string[];
};

export type BabelState = {
  opts: Options;
};

export function captureVariableNamesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        enter: (path, state) => {
          const found = path
            .get('body')
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isMacrostylesImport(p, 'core'),
            );

          if (!found) {
            path.stop();
            return;
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
                if (!isMacrostylesImport(p, 'core')) {
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
                if (!isMacrostylesImport(path, 'core')) {
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
      ImportDeclaration: {
        enter: (path, state) => {
          const source = path.get('source').node.value;
          const names = path
            .get('specifiers')
            .filter((s): s is NodePath<types.ImportSpecifier> =>
              s.isImportSpecifier(),
            )
            .map((i) => {
              const imported = i.get('imported');
              const className = imported.isIdentifier()
                ? imported.node.name
                : null;
              if (!className) {
                return;
              }
              const localName = i.get('local').node.name;
              return { className, localName };
            })
            .filter((x): x is ImportSource['names'][number] => !!x);
          state.opts.importSources.push({ names, source });
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
            const originalName = id.node.name;
            const temporalId = path.scope.generateUidIdentifier(
              `temporal_${originalName}`,
            );

            const exportingTemporalNode = t.exportNamedDeclaration(
              t.variableDeclaration('const', [
                t.variableDeclarator(temporalId, init.get('quasi').node),
              ]),
            );
            if (path.parentPath.isExportNamedDeclaration()) {
              path.parentPath.insertAfter(exportingTemporalNode);
            } else {
              path.insertAfter(exportingTemporalNode);
            }
            init.replaceWith(t.stringLiteral(originalName));

            state.opts.capturedVariableNames.set(originalName, {
              originalName,
              temporalName: temporalId.name,
              tagType: 'css',
            });
          }
        },
      },
    },
  };
}
