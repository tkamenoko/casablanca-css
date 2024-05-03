import type { NodePath, types } from "@babel/core";

type ExtractPathsFromQuasiReturn = {
  expression: NodePath<types.TSType | types.Expression>;
  ids: NodePath<types.Identifier>[];
  style: string;
} | null;

export function extractPathsFromQuasi({
  expressions,
  index,
  quasi,
}: {
  expressions: NodePath<types.TSType | types.Expression>[];
  index: number;
  quasi: NodePath<types.TemplateElement>;
}): ExtractPathsFromQuasiReturn {
  const expression = expressions.at(index);
  if (!expression) {
    return null;
  }
  const ids = expression.isArrayExpression()
    ? expression
        .get("elements")
        .filter((e): e is NodePath<types.Identifier> => e.isIdentifier())
    : expression.isIdentifier()
      ? [expression]
      : [];
  if (!ids.length) {
    return null;
  }
  const style = quasi.node.value.raw;
  if (!style.match(/(?:;|\s)composes:\s*$/)) {
    return null;
  }
  return { expression, ids, style };
}
