import type { NodePath, types } from "@babel/core";

type ExtractPathsFromExpressionsReturn = {
  expression: NodePath<types.Identifier>;
  nextLiteral: NodePath<types.TemplateElement>;
};

export function extractPathsFromExpressions({
  expressions,
  index,
  literal,
  quasis,
}: {
  expressions: NodePath<types.TSType | types.Expression>[];
  index: number;
  literal: NodePath<types.TemplateElement>;
  quasis: NodePath<types.TemplateElement>[];
}): ExtractPathsFromExpressionsReturn | null {
  const expression = expressions.at(index);
  if (!expression?.isIdentifier()) {
    return null;
  }
  if (!literal.node.value.raw.endsWith(".")) {
    return null;
  }
  const nextLiteral = quasis.at(index + 1);
  if (!nextLiteral) {
    throw new Error("Unreachable");
  }
  return { expression, nextLiteral };
}
