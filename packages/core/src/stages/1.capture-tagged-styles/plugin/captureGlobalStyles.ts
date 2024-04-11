import { type NodePath, type PluginPass, types } from "@babel/core";
import {
  isCasablancaCssTemplate,
  isTopLevelStatement,
} from "@casablanca/utils";
import type { BabelState } from "../types";

export function captureGlobalStyles(
  path: NodePath<types.ExpressionStatement>,
  state: PluginPass & BabelState,
): boolean {
  if (!isTopLevelStatement(path)) {
    return false;
  }
  const exp = path.get("expression");
  if (!exp.isTaggedTemplateExpression()) {
    return false;
  }
  if (!isCasablancaCssTemplate(exp, "injectGlobal")) {
    return false;
  }
  // create temp var
  const temporalId = path.scope.generateUidIdentifier("temporal_global");
  // assign style
  const exportingTemporalNode = types.exportNamedDeclaration(
    types.variableDeclaration("const", [
      types.variableDeclarator(temporalId, exp.get("quasi").node),
    ]),
  );
  path.replaceWith(exportingTemporalNode);
  // push to capturedGlobalStyleTempNames
  state.opts.capturedGlobalStylesTempNames.push(temporalId.name);
  return true;
}
