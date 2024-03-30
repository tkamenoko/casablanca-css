import type { NodePath, types } from "@babel/core";
import type { CapturedVariableNames } from "../1.capture-tagged-styles";

export function removeTemporalVariable({
  temporalVariableNames,
  declaration,
  name,
}: {
  temporalVariableNames: CapturedVariableNames;
  declaration: NodePath<types.VariableDeclaration>;
  name: string;
}): void {
  const removeTarget = temporalVariableNames.get(name);
  if (removeTarget && declaration.parentPath.isExportNamedDeclaration()) {
    declaration.parentPath.remove();
    return;
  }
}
