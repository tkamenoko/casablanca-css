import type { NodePath, types } from "@babel/core";

type ExtractTemplatePathFromDeclaratorReturn = {
  init: NodePath<types.TemplateLiteral>;
} | null;

export function extractTemplatePathFromDeclarator({
  declarator,
  temporalVariableNames,
}: {
  declarator: NodePath<types.VariableDeclarator>;
  temporalVariableNames: string[];
}): ExtractTemplatePathFromDeclaratorReturn {
  const id = declarator.get("id");
  if (!id.isIdentifier() || !temporalVariableNames.includes(id.node.name)) {
    return null;
  }
  const init = declarator.get("init");
  if (!init.isTemplateLiteral()) {
    return null;
  }
  return { init };
}
