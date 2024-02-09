import type { PluginObj, PluginPass } from "@babel/core";
import { isMacrostylesImport } from "@macrostyles/utils";
import type { BabelState } from "./types";

const tagNames = new Set(["css", "injectGlobal"]);

export function removeImportsPlugin(): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        exit: (path) => {
          path.traverse({
            ImportDeclaration: {
              enter: (path_) => {
                if (!isMacrostylesImport(path_, "core")) {
                  return;
                }
                for (const item of path_.get("specifiers")) {
                  if (!item.isImportSpecifier()) {
                    continue;
                  }
                  const imported = item.get("imported");
                  if (imported.isIdentifier()) {
                    const importedName = imported.node.name;
                    if (tagNames.has(importedName)) {
                      item.remove();
                    }
                  }
                }
                if (!path_.get("specifiers").length) {
                  path_.remove();
                }
              },
            },
          });
        },
      },
    },
  };
}
