import { types } from "@babel/core";
import type { ComposeArg } from "./types";

export function buildComposeInternalExpression({
  composeArgs,
}: {
  composeArgs: ComposeArg[];
}): types.CallExpression {
  const result = types.callExpression(
    types.identifier("__composeInternal"),
    composeArgs.map(({ resolvedId, uuid, valueId, varName }) => {
      const resolvedIdProperty = types.objectProperty(
        types.identifier("resolvedId"),
        resolvedId ? types.stringLiteral(resolvedId) : types.nullLiteral(),
      );
      const uuidProperty = types.objectProperty(
        types.identifier("uuid"),
        types.stringLiteral(uuid),
      );
      const valueProperty = types.objectProperty(
        types.identifier("value"),
        valueId,
      );
      const varNameProperty = types.objectProperty(
        types.identifier("varName"),
        types.stringLiteral(varName),
      );
      return types.objectExpression([
        resolvedIdProperty,
        uuidProperty,
        valueProperty,
        varNameProperty,
      ]);
    }),
  );
  return result;
}
