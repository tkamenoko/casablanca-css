import type { NodePath, PluginObj, PluginPass, types } from "@babel/core";
import type babel from "@babel/core";
import {
  isCasablancaCssTemplate,
  isCasablancaImport,
  isTopLevelStatement,
} from "@casablanca/utils";
import type { BabelState } from "./types";

export function captureVariableNamesPlugin({
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
      VariableDeclaration: {
        enter: (path, state) => {
          if (!isTopLevelStatement(path)) {
            return;
          }
          for (const declaration of path.get("declarations")) {
            const init = declaration.get("init");

            if (!isCasablancaCssTemplate(init, "css")) {
              return;
            }
            const id = declaration.get("id");
            if (!id.isIdentifier()) {
              return;
            }
            const originalName = id.node.name;
            const temporalId = path.scope.generateUidIdentifier(
              `temporal_${originalName}`,
            );

            const exportingTemporalNode = t.exportNamedDeclaration(
              t.variableDeclaration("const", [
                t.variableDeclarator(temporalId, init.get("quasi").node),
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
            });
          }
        },
      },
    },
  };
}
