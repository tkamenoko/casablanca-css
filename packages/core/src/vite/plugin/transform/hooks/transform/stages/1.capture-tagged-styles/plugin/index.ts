import type { NodePath, PluginObj, PluginPass, types } from "@babel/core";
import { isCasablancaImport } from "@casablanca-css/utils";
import type { BabelState } from "../types";
import { captureGlobalStyle } from "./captureGlobalStyle";
import { captureVariableName } from "./captureVariableName";
import { collectImportSource } from "./collectImportSource";
import { removeImports } from "./removeImports";

export function plugin(): PluginObj<PluginPass & BabelState> {
  return {
    pre() {
      this.shouldTraverse = false;
    },
    visitor: {
      Program: {
        enter: (path, state) => {
          const found = path
            .get("body")
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isCasablancaImport(p, "core"),
            );

          if (found) {
            state.shouldTraverse = true;
          }
        },
        exit: (path, state) => {
          if (!state.shouldTraverse) {
            return;
          }
          path.traverse({
            ImportDeclaration: {
              enter: (p) => {
                removeImports(p);
              },
            },
          });
        },
      },
      ImportDeclaration: {
        enter: (path, state) => {
          if (!state.shouldTraverse) {
            return;
          }
          const importSource = collectImportSource(path);
          state.opts.importSources.push(importSource);
        },
      },
      VariableDeclarator: {
        enter: (path, state) => {
          if (!state.shouldTraverse) {
            return;
          }
          const captured = captureVariableName(path);
          if (!captured) {
            return;
          }
          const {
            capturedVariableInfo,
            exportingTemporalCssNode,
            originalClassNameNode,
          } = captured;

          const declaration = path.parentPath;
          if (declaration.isExportNamedDeclaration()) {
            declaration.parentPath.insertAfter(exportingTemporalCssNode);
          } else {
            declaration.insertAfter(exportingTemporalCssNode);
          }

          const init = path.get("init");
          init.replaceWith(originalClassNameNode);

          state.opts.capturedVariableNames.set(
            capturedVariableInfo.originalName,
            capturedVariableInfo,
          );
        },
      },
      ExpressionStatement: {
        enter: (path, state) => {
          if (!state.shouldTraverse) {
            return;
          }
          const captured = captureGlobalStyle(path);
          if (!captured) {
            return;
          }
          const {
            exportingTemporalNode,
            originalPosition,
            temporalGlobalStyleName,
          } = captured;
          path.replaceWith(exportingTemporalNode);
          state.opts.capturedGlobalStylesTempNames.push(
            temporalGlobalStyleName,
          );
          state.opts.globalStylePositions.push(originalPosition);
        },
      },
    },
  };
}
