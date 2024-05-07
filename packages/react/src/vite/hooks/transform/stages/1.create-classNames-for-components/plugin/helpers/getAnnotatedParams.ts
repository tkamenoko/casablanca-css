import type { NodePath, types } from "@babel/core";

export function getAnnotatedParams(
  path: NodePath<types.TaggedTemplateExpression>,
): string[] {
  // styled(Component)<{foo: string, bar: number}>`...` -> ["foo", "bar"]
  const typeParams = path.get("typeParameters");
  if (!typeParams.isTSTypeParameterInstantiation()) {
    return [];
  }
  const typeLiteral = typeParams.get("params").at(0);
  if (!typeLiteral?.isTSTypeLiteral()) {
    return [];
  }
  const members = typeLiteral.get("members").map((m) => {
    if (!m.isTSPropertySignature()) {
      return null;
    }
    const key = m.get("key");
    if (!key.isIdentifier()) {
      return null;
    }
    return key.node.name;
  });
  return members.filter((x): x is string => !!x);
}
