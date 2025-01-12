import { types } from "@babel/core";

export function buildStyleExtractingStatement({
  givenStyleId,
  propsId,
}: {
  givenStyleId: types.Identifier;
  propsId: types.Identifier;
}): types.VariableDeclaration {
  // const {style: givenStyleId} = propsId
  const styleId = types.identifier("style");
  const extractedGivenStyle = types.variableDeclaration("const", [
    types.variableDeclarator(
      types.objectPattern([types.objectProperty(styleId, givenStyleId)]),
      propsId,
    ),
  ]);
  return extractedGivenStyle;
}
