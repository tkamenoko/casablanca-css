import { randomUUID } from 'node:crypto';

import type babel from '@babel/core';
import type { NodePath, PluginObj, PluginPass, types } from '@babel/core';

import { isTopLevelStatement } from '@/stages/helpers/isTopLevelStatement';
import type { ResolvedModuleId } from '@/vite/types';

export type Options = {
  temporalVariableNames: string[];
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
              !state.opts.temporalVariableNames.includes(id.node.name)
            ) {
              continue;
            }
            const init = declaration.get('init');
            if (!init.isTemplateLiteral()) {
              continue;
            }
            const expressions = init.get('expressions');
            const quasis = init.get('quasis');
            for (const [i, quasi] of quasis.entries()) {
              const expression = expressions.at(i);
              if (!expression) {
                continue;
              }
              const ids = expression.isArrayExpression()
                ? expression
                    .get('elements')
                    .filter((e): e is NodePath<types.Identifier> =>
                      e.isIdentifier(),
                    )
                : expression.isIdentifier()
                ? [expression]
                : [];
              if (!ids.length) {
                continue;
              }
              const style = quasi.node.value.raw;
              if (!style.match(/(?:;|\s)composes:\s*$/)) {
                continue;
              }
              const uuids: string[] = [];
              for (const id of ids) {
                const name = id.node.name;
                const {
                  className,
                  cssId,
                  uuid = randomUUID(),
                } = state.opts.embeddedToClassNameMap.get(name) ?? {};
                state.opts.uuidToStylesMap.set(uuid, {
                  className: className ?? name,
                  resolvedId: cssId ?? null,
                });
                uuids.push(uuid);
              }

              expression.replaceWith(t.stringLiteral(uuids.join('\n')));
              const removedCompose = style.replace(
                /(?<prev>;|\s)composes:\s*$/,
                '$<prev>',
              );
              quasi.node.value.raw = removedCompose;
            }
          }
        },
      },
    },
  };
}
