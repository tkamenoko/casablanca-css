import type { NodePath, types } from "@babel/core";
import type { ImportSource } from "../types";

export function collectImportSource(
  path: NodePath<types.ImportDeclaration>,
): ImportSource {
  // collect imported classNames
  // import {className as localName} from "source";
  const source = path.get("source").node.value;
  const names = path
    .get("specifiers")
    .filter((s): s is NodePath<types.ImportSpecifier> => s.isImportSpecifier())
    .map((i) => {
      const imported = i.get("imported");
      const className = imported.isIdentifier() ? imported.node.name : null;
      if (!className) {
        return;
      }
      const localName = i.get("local").node.name;
      return { className, localName };
    })
    .filter((x): x is ImportSource["names"][number] => !!x);
  return { names, source };
}
