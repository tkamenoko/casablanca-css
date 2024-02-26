import type { NodePath, types } from "@babel/core";

type ExtractPathsFromDeclarationReturn = {
  init: NodePath<types.TemplateLiteral>;
} | null;

export function extractPathsFromDeclaration({
  declaration,
  temporalVariableNames,
}: {
  declaration: NodePath<types.VariableDeclarator>;
  temporalVariableNames: string[];
}): ExtractPathsFromDeclarationReturn {
  const id = declaration.get("id");
  if (!id.isIdentifier() || !temporalVariableNames.includes(id.node.name)) {
    return null;
  }
  const init = declaration.get("init");
  if (!init.isTemplateLiteral()) {
    return null;
  }
  return { init };
}
