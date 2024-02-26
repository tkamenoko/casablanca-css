import type { NodePath, types } from "@babel/core";
import type { CapturedVariableNames } from "../1.capture-tagged-styles";

export function removeTemporalVariable({
  temporalVariableNames,
  path,
  name,
}: {
  temporalVariableNames: CapturedVariableNames;
  path: NodePath<types.VariableDeclaration>;
  name: string;
}): void {
  const removeTarget = temporalVariableNames.get(name);
  if (removeTarget && path.parentPath.isExportNamedDeclaration()) {
    path.parentPath.remove();
    return;
  }
}
