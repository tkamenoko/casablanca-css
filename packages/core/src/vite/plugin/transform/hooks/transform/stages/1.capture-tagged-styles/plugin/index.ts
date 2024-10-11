import type { NodePath, PluginObj, PluginPass, types } from "@babel/core";
import { isCasablancaImport } from "@casablanca-css/utils";
import type { BabelState } from "../types";
import { captureGlobalStyles } from "./captureGlobalStyles";
import { captureVariableNames } from "./captureVariables";
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
          captureVariableNames(path, state);
        },
      },
      ExpressionStatement: {
        enter: (path, state) => {
          if (!state.shouldTraverse) {
            return;
          }
          captureGlobalStyles(path, state);
        },
      },
    },
  };
}
