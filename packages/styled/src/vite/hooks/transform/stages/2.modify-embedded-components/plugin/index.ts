import type babel from "@babel/core";
import type { NodePath, PluginObj, PluginPass, types } from "@babel/core";
import {
  isCasablancaCssTemplate,
  isCasablancaImport,
} from "@casablanca-css/utils";
import { extractPathsFromExpressions } from "./helpers/extractPathsFromExpressions";
import { isImportedComponent } from "./helpers/isImportedComponent";

export function plugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & { shouldTraverse: boolean }> {
  return {
    visitor: {
      Program: {
        enter: (path, state) => {
          const found = path
            .get("body")
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isCasablancaImport(p, "core"),
            );
          state.shouldTraverse = Boolean(found);
        },
      },
      TaggedTemplateExpression: {
        enter: (path, state) => {
          if (!state.shouldTraverse) {
            return;
          }
          if (!isCasablancaCssTemplate(path, "css")) {
            return;
          }
          const quasi = path.get("quasi");
          const quasis = quasi.get("quasis");
          const expressions = quasi.get("expressions");
          for (const [index, literal] of quasis.entries()) {
            const validatedExpression = extractPathsFromExpressions({
              expressions,
              index,
              literal,
              quasis,
            });
            if (!validatedExpression) {
              continue;
            }
            const { expression, nextLiteral } = validatedExpression;
            // replace `.${Component}` selector with className
            const componentId = expression.node;
            if (!isImportedComponent(expression)) {
              expression.replaceWith(
                t.memberExpression(componentId, t.identifier("__rawClassName")),
              );
              continue;
            }

            const globalOpen = `${literal.node.value.raw.slice(
              0,
              -1,
            )}:global(.`;
            const globalClose = `)${nextLiteral.node.value.raw}`;

            literal.replaceWith(t.templateElement({ raw: globalOpen }));
            nextLiteral.replaceWith(t.templateElement({ raw: globalClose }));
            expression.replaceWith(
              t.memberExpression(
                componentId,
                t.identifier("__modularizedClassName"),
              ),
            );
          }
        },
      },
    },
  };
}
