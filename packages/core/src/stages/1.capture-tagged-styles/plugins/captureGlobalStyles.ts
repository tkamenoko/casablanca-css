import type { NodePath, PluginObj, PluginPass, types } from "@babel/core";
import type babel from "@babel/core";
import {
  isCasablancaCssTemplate,
  isCasablancaImport,
  isTopLevelStatement,
} from "@casablanca/utils";
import type { BabelState } from "../types";

export function captureGlobalStylesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        enter: (path) => {
          const found = path
            .get("body")
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isCasablancaImport(p, "core"),
            );

          if (!found) {
            path.stop();
            return;
          }
        },
      },
      ExpressionStatement: {
        enter: (path, state) => {
          if (!isTopLevelStatement(path)) {
            return;
          }
          const exp = path.get("expression");
          if (!exp.isTaggedTemplateExpression()) {
            return;
          }
          if (!isCasablancaCssTemplate(exp, "injectGlobal")) {
            return;
          }
          // create temp var
          const temporalId =
            path.scope.generateUidIdentifier("temporal_global");
          // assign style
          const exportingTemporalNode = t.exportNamedDeclaration(
            t.variableDeclaration("const", [
              t.variableDeclarator(temporalId, exp.get("quasi").node),
            ]),
          );
          path.replaceWith(exportingTemporalNode);
          // push to capturedGlobalStyleTempNames
          state.opts.capturedGlobalStylesTempNames.push(temporalId.name);
        },
      },
    },
  };
}
