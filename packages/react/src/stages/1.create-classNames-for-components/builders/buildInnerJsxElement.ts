import { types } from "@babel/core";

export function buildInnerJsxElement({
  jsxId,
  propsId,
  classNameId,
  inlineStyleId,
}: {
  jsxId: types.JSXIdentifier;
  propsId: types.Identifier;
  classNameId: types.Identifier;
  inlineStyleId: types.Identifier;
}): types.JSXElement {
  const innerJsxElement = types.jsxElement(
    types.jsxOpeningElement(
      jsxId,
      [
        types.jsxSpreadAttribute(propsId),
        types.jsxAttribute(
          types.jsxIdentifier("className"),
          types.jsxExpressionContainer(classNameId),
        ),
        types.jsxAttribute(
          types.jsxIdentifier("style"),
          types.jsxExpressionContainer(inlineStyleId),
        ),
      ],
      true,
    ),
    null,
    [],
  );
  return innerJsxElement;
}
