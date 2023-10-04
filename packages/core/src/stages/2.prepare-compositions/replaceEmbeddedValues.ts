import { randomUUID } from 'node:crypto';

import type babel from '@babel/core';
import type { PluginObj, PluginPass } from '@babel/core';

import { isMacrostylesImport } from '@/stages/helpers/isMacrostylesImport';
import { isTopLevelStatement } from '@/stages/helpers/isTopLevelStatement';
import type { ResolvedModuleId } from '@/types';

export type Options = {
  variableNames: string[];
  embeddedToClassNameMap: Map<
    string,
    { className: string; cssId: ResolvedModuleId; uuid: string }
  >;
  uuidToStylesMap: Map<
    string,
    {
      resolvedId: ResolvedModuleId | null;
      className: string;
    }
  >;
};

type BabelState = {
  opts: Options;
};

export function replaceEmbeddedValuesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        enter: (path) => {
          // skip if `compose` is not used.
          const imports = path.get('body').filter(isMacrostylesImport);
          if (!imports.length) {
            path.stop();
            return;
          }
          const importCompose = imports.find((i) =>
            i.get('specifiers').find((s) => {
              if (!s.isImportSpecifier()) {
                return false;
              }
              const imported = s.get('imported');
              return (
                imported.isIdentifier() && imported.node.name === 'compose'
              );
            }),
          );
          if (!importCompose) {
            path.stop();
            return;
          }
        },
        exit: (path) => {
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
                    if (importedName === 'compose') {
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
          // find target templates.
          if (!isTopLevelStatement(path)) {
            return;
          }
          for (const declaration of path.get('declarations')) {
            const id = declaration.get('id');
            if (
              !id.isIdentifier() ||
              !state.opts.variableNames.includes(id.node.name)
            ) {
              continue;
            }
            const init = declaration.get('init');
            if (!init.isTemplateLiteral()) {
              continue;
            }
            for (const expression of init.get('expressions')) {
              // using `compose` ?
              if (!expression.isCallExpression()) {
                continue;
              }
              const callee = expression.get('callee');
              if (!callee.isIdentifier() || callee.node.name !== 'compose') {
                continue;
              }
              const styles: {
                className: string;
                cssId: ResolvedModuleId | null;
                uuid: string;
              }[] = [];
              for (const argument of expression.get('arguments')) {
                if (!argument.isIdentifier()) {
                  continue;
                }
                const name = argument.node.name;
                const {
                  className,
                  cssId,
                  uuid = randomUUID(),
                } = state.opts.embeddedToClassNameMap.get(name) ?? {};

                state.opts.uuidToStylesMap.set(uuid, {
                  className: className ?? name,
                  resolvedId: cssId ?? null,
                });
                styles.push({
                  className: className ?? name,
                  cssId: cssId ?? null,
                  uuid,
                });
              }
              if (!styles.length) {
                throw new Error('Invalid `compose` usage');
              }
              // replace with "composes: ...;\n" expressions.
              expression.replaceWith(
                t.stringLiteral(styles.map((s) => s.uuid).join('\n')),
              );
            }
          }
        },
      },
    },
  };
}
