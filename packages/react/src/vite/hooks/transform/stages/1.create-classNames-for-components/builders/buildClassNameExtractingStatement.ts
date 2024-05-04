import { types } from "@babel/core";

export function buildClassNameExtractingStatement({
  givenClassNameId,
  propsId,
}: {
  givenClassNameId: types.Identifier;
  propsId: types.Identifier;
}): types.VariableDeclaration {
  // const {className: givenClassNameId} = propsId
  const classNameId = types.identifier("className");
  const extractedGivenClassName = types.variableDeclaration("const", [
    types.variableDeclarator(
      types.objectPattern([
        types.objectProperty(classNameId, givenClassNameId),
      ]),
      propsId,
    ),
  ]);
  return extractedGivenClassName;
}
