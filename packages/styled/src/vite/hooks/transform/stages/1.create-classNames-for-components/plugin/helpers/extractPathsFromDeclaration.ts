import type { NodePath, types } from "@babel/core";
import { isCasablancaStyledTemplate } from "../../../helpers/isCasablancaStyledTemplate";

type ExtractPathsFromDeclarationReturn = {
  init: NodePath<types.TaggedTemplateExpression>;
  componentId: NodePath<types.Identifier>;
  componentName: string;
  styledComponent: NodePath<types.Identifier> | NodePath<types.StringLiteral>;
} | null;

export function extractPathsFromDeclaration(
  declaration: NodePath<types.VariableDeclarator>,
): ExtractPathsFromDeclarationReturn {
  const init = declaration.get("init");
  if (!isCasablancaStyledTemplate(init)) {
    return null;
  }
  const tag = init.get("tag");
  if (!tag.isCallExpression()) {
    return null;
  }

  const componentId = declaration.get("id");
  if (!componentId.isIdentifier()) {
    return null;
  }
  const componentName = componentId.node.name;
  if (!componentName.at(0)?.match(/[A-Z]/)) {
    throw new Error(
      `Component name "${{
        componentName,
      }}" must starts with upper case.`,
    );
  }
  const styledComponent = tag.get("arguments").at(0);
  if (
    !(styledComponent?.isIdentifier() || styledComponent?.isStringLiteral())
  ) {
    throw new Error(`Invalid "styled" usage for ${componentName}`);
  }
  return { componentId, componentName, init, styledComponent };
}
