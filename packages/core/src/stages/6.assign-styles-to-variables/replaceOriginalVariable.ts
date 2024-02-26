import { type NodePath, types } from "@babel/core";
import type { CapturedVariableNames } from "../1.capture-tagged-styles";

export function replaceOriginalVariable({
  originalToTemporalMap,
  declaration,
  stylesId,
  name,
}: {
  originalToTemporalMap: CapturedVariableNames;
  declaration: NodePath<types.VariableDeclarator>;
  stylesId: types.Identifier;
  name: string;
}): void {
  const replaceTarget = originalToTemporalMap.get(name);
  if (replaceTarget) {
    declaration
      .get("init")
      .replaceWith(
        types.memberExpression(stylesId, types.stringLiteral(name), true),
      );
  }
}
