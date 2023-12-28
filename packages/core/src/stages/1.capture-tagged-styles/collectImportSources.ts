import type { PluginObj, PluginPass, types, NodePath } from '@babel/core';
import { isMacrostylesImport } from '@macrostyles/utils';

import type { BabelState, ImportSource } from './types';

export function collectImportSourcesPlugin(): PluginObj<
  PluginPass & BabelState
> {
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
    },
  };
}
