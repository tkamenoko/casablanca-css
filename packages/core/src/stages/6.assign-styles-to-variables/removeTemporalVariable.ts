import type { NodePath, types } from "@babel/core";

export function removeTemporalVariable({
  temporalVariableNames,
  declaration,
  name,
}: {
  temporalVariableNames: Set<string>;
  declaration: NodePath<types.VariableDeclaration>;
  name: string;
}): void {
  if (
    temporalVariableNames.has(name) &&
    declaration.parentPath.isExportNamedDeclaration()
  ) {
    declaration.parentPath.remove();
  }
}
