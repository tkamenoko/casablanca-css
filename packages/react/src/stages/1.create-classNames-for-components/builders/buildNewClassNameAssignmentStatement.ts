import { types } from "@babel/core";

export function buildNewClassNameAssignmentStatement({
  additionalClassNameId,
  cssTaggedId,
  newClassNameId,
}: {
  additionalClassNameId: types.Identifier;
  cssTaggedId: types.Identifier;
  newClassNameId: types.Identifier;
}): types.VariableDeclaration {
  // const newClassName=`${additionalClassNameId??""} ${cssTaggedId}`
  const newClassNameTemplate = types.templateLiteral(
    [
      types.templateElement({ raw: "" }),
      types.templateElement({ raw: " " }),
      types.templateElement({ raw: "" }),
    ],
    [
      types.logicalExpression(
        "??",
        additionalClassNameId,
        types.stringLiteral(""),
      ),
      cssTaggedId,
    ],
  );
  const assignNewClassName = types.variableDeclaration("const", [
    types.variableDeclarator(newClassNameId, newClassNameTemplate),
  ]);
  return assignNewClassName;
}
