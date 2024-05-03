import type { NodePath, PluginPass, types } from "@babel/core";
import type { BabelState, ImportSource } from "../types";

export function collectImportSources(
  path: NodePath<types.ImportDeclaration>,
  state: PluginPass & BabelState,
): boolean {
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
  state.opts.importSources.push({ names, source });
  return true;
}
