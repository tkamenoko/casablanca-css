import { type NodePath, types } from "@babel/core";
import {
  isCasablancaCssTemplate,
  isTopLevelStatement,
} from "@casablanca-css/utils";
import type { GlobalStylePosition } from "../types";

export function captureGlobalStyle(path: NodePath<types.ExpressionStatement>): {
  exportingTemporalNode: types.ExportNamedDeclaration;
  temporalGlobalStyleName: string;
  originalPosition: GlobalStylePosition;
} | null {
  // capture tagged global style
  // injectGlobal`...style`;
  // ->
  // export const temporalName = `...style`;
  if (!isTopLevelStatement(path)) {
    return null;
  }
  const exp = path.get("expression");
  if (!exp.isTaggedTemplateExpression()) {
    return null;
  }
  if (!isCasablancaCssTemplate(exp, "injectGlobal")) {
    return null;
  }
  if (!path.node.loc) {
    throw new Error("Missing node location");
  }
  const originalPosition = {
    start: { ...path.node.loc.start },
    end: { ...path.node.loc.end },
  };
  // create temp var
  const temporalId = path.scope.generateUidIdentifier("temporal_global");
  // assign style
  const exportingTemporalNode = types.exportNamedDeclaration(
    types.variableDeclaration("const", [
      types.variableDeclarator(temporalId, exp.get("quasi").node),
    ]),
  );

  return {
    exportingTemporalNode,
    temporalGlobalStyleName: temporalId.name,
    originalPosition,
  };
}
