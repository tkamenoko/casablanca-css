import type babel from '@babel/core';
import type { PluginObj, PluginPass } from '@babel/core';
import { transformAsync } from '@babel/core';

import { createViteObjectExport } from './createViteObjectExport';
import { createViteDefaultExport } from './createViteDefaultExport';

function fixSsrTransformPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass> {
  return {
    visitor: {
      VariableDeclaration: {
        enter: (path) => {
          const declarator = path.get('declarations').at(0);
          if (!declarator || path.node.declarations.length > 1) {
            return;
          }
          const id = declarator.get('id');
          if (!id.isIdentifier()) {
            return;
          }
          const init = declarator.get('init');
          if (!init.isAwaitExpression()) {
            return;
          }
          const importFunction = init.get('argument');
          if (!importFunction.isCallExpression()) {
            return;
          }
          const callee = importFunction.get('callee');
          if (
            !callee.isIdentifier() ||
            callee.node.name !== '__vite_ssr_import__'
          ) {
            return;
          }
          const importSource = importFunction.get('arguments').at(0);
          if (!importSource?.isStringLiteral()) {
            return;
          }
          const importDecNode = t.importDeclaration(
            [t.importNamespaceSpecifier(id.node)],
            importSource.node,
          );
          path.replaceWith(importDecNode);
        },
      },
      ExpressionStatement: {
        enter: (path) => {
          const e = path.get('expression');
          if (e.isCallExpression()) {
            const replacing = createViteObjectExport(e);
            if (replacing) {
              path.replaceWithMultiple(replacing);
            }
            return;
          }
          if (e.isAssignmentExpression()) {
            const replacing = createViteDefaultExport(e);
            if (replacing) {
              path.replaceWith(replacing);
            }
            return;
          }
        },
      },
    },
  };
}

export async function fixSsrTransform(code: string): Promise<string> {
  const result = await transformAsync(code, {
    plugins: [[fixSsrTransformPlugin, {}]],
  });
  if (!result?.code) {
    throw new Error('Failed to transform SSR-fied code');
  }
  return result.code;
}
