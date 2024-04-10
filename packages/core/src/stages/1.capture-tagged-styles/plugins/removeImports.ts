import type { PluginObj, PluginPass } from "@babel/core";
import { isCasablancaImport } from "@casablanca/utils";
import type { BabelState } from "../types";
import { getImportedName } from "./helpers/getImportedName";

const tagNames = new Set(["css", "injectGlobal"]);

export function removeImportsPlugin(): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        exit: (path) => {
          path.traverse({
            ImportDeclaration: {
              enter: (path_) => {
                if (!isCasablancaImport(path_, "core")) {
                  return;
                }
                for (const item of path_.get("specifiers")) {
                  const importedName = getImportedName(item);
                  if (importedName && tagNames.has(importedName)) {
                    item.remove();
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
