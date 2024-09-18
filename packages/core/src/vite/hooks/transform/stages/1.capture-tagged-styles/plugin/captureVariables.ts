import { type NodePath, type PluginPass, types } from "@babel/core";
import {
  isCasablancaCssTemplate,
  isTopLevelStatement,
} from "@casablanca-css/utils";
import type { BabelState } from "../types";

export function captureVariableNames(
  path: NodePath<types.VariableDeclarator>,
  state: PluginPass & BabelState,
): boolean {
  const declaration = path.parentPath;
  if (!(declaration.isDeclaration() && isTopLevelStatement(declaration))) {
    return false;
  }
  const init = path.get("init");

  if (!isCasablancaCssTemplate(init, "css")) {
    return false;
  }
  const id = path.get("id");
  if (!id.isIdentifier()) {
    return false;
  }
  const originalName = id.node.name;

  if (!path.node.loc) {
    throw new Error(`Missing node location: ${originalName}`);
  }
  const originalPosition = {
    start: { ...path.node.loc.start },
    end: { ...path.node.loc.end },
  };

  const temporalId = path.scope.generateUidIdentifier(
    `temporal_${originalName}`,
  );

  const exportingTemporalNode = types.exportNamedDeclaration(
    types.variableDeclaration("const", [
      types.variableDeclarator(temporalId, init.get("quasi").node),
    ]),
  );
  if (declaration.isExportNamedDeclaration()) {
    declaration.parentPath.insertAfter(exportingTemporalNode);
  } else {
    declaration.insertAfter(exportingTemporalNode);
  }
  init.replaceWith(types.stringLiteral(originalName));

  state.opts.capturedVariableNames.set(originalName, {
    originalName,
    temporalName: temporalId.name,
    start: originalPosition.start,
    end: originalPosition.end,
  });
  return true;
}
