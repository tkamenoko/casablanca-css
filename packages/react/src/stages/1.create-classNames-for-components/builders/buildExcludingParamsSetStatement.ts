import { types } from "@babel/core";

export function buildExcludingParamsSetStatement({
  paramsSetId,
  annotatedParams,
}: {
  paramsSetId: types.Identifier;
  annotatedParams: types.StringLiteral[];
}): types.VariableDeclaration {
  // const paramsSet=new Set(["foo","bar"])

  const paramsSet = types.variableDeclaration("const", [
    types.variableDeclarator(
      paramsSetId,
      types.newExpression(types.identifier("Set"), [
        types.arrayExpression(annotatedParams),
      ]),
    ),
  ]);
  return paramsSet;
}
