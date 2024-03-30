import { type NodePath, types } from "@babel/core";
import type { CapturedVariableNames } from "../1.capture-tagged-styles";

export function replaceOriginalVariable({
  originalToTemporalMap,
  declarator,
  stylesId,
  name,
}: {
  originalToTemporalMap: CapturedVariableNames;
  declarator: NodePath<types.VariableDeclarator>;
  stylesId: types.Identifier;
  name: string;
}): void {
  const replaceTarget = originalToTemporalMap.get(name);
  if (replaceTarget) {
    declarator
      .get("init")
      .replaceWith(
        types.memberExpression(stylesId, types.stringLiteral(name), true),
      );
  }
}
