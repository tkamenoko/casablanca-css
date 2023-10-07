import { randomUUID } from 'node:crypto';

import type babel from '@babel/core';
import type { PluginObj, PluginPass } from '@babel/core';

import { isTopLevelStatement } from '@/stages/helpers/isTopLevelStatement';
import type { ResolvedModuleId } from '@/types';

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

            for (const expression of init.get('expressions')) {
              if (!expression.isMemberExpression()) {
                continue;
              }
              const property = expression.get('property');
              if (
                !(
                  property.isIdentifier() &&
                  property.node.name === '__compose__'
                )
              ) {
                continue;
              }
              const o = expression.get('object');
              if (!o.isIdentifier()) {
                continue;
              }
              const name = o.node.name;
              const {
                className,
                cssId,
                uuid = randomUUID(),
              } = state.opts.embeddedToClassNameMap.get(name) ?? {};
              state.opts.uuidToStylesMap.set(uuid, {
                className: className ?? name,
                resolvedId: cssId ?? null,
              });
              expression.replaceWith(t.stringLiteral(uuid));
            }
          }
        },
      },
    },
  };
}
