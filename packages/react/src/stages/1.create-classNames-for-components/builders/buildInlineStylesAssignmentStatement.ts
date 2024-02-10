import { types } from "@babel/core";

export function buildInlineStylesAssignmentStatement({
  cssDynamicVars,
  propsId,
  inlineStyleId,
}: {
  cssDynamicVars: {
    functionId: types.Identifier;
    cssVarName: `--${string}`;
  }[];
  propsId: types.Identifier;
  inlineStyleId: types.Identifier;
}): types.VariableDeclaration {
  const inlineStyleProperties = cssDynamicVars.map(
    ({ cssVarName, functionId }) => {
      return types.objectProperty(
        types.stringLiteral(cssVarName),
        types.callExpression(functionId, [propsId]),
      );
    },
  );
  const assignInlineStyles = types.variableDeclaration("const", [
    types.variableDeclarator(
      inlineStyleId,
      types.objectExpression(inlineStyleProperties),
    ),
  ]);
  return assignInlineStyles;
}
