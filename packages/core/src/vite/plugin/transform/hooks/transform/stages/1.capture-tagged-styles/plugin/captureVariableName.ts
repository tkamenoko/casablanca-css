import { type NodePath, types } from "@babel/core";
import {
  isCasablancaCssTemplate,
  isTopLevelStatement,
} from "@casablanca-css/utils";
import type { VariableInfo } from "../types";

export function captureVariableName(path: NodePath<types.VariableDeclarator>): {
  exportingTemporalCssNode: types.ExportNamedDeclaration;
  originalClassNameNode: types.StringLiteral;
  capturedVariableInfo: VariableInfo;
} | null {
  const declaration = path.parentPath;
  if (!(declaration.isDeclaration() && isTopLevelStatement(declaration))) {
    return null;
  }

  const init = path.get("init");

  if (!isCasablancaCssTemplate(init, "css")) {
    return null;
  }
  const id = path.get("id");
  if (!id.isIdentifier()) {
    return null;
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

  const exportingTemporalCssNode = types.exportNamedDeclaration(
    types.variableDeclaration("const", [
      types.variableDeclarator(temporalId, init.get("quasi").node),
    ]),
  );
  const originalClassNameNode = types.stringLiteral(originalName);
  const capturedVariableInfo = {
    originalName,
    temporalName: temporalId.name,
    start: originalPosition.start,
    end: originalPosition.end,
  };

  return {
    capturedVariableInfo,
    exportingTemporalCssNode,
    originalClassNameNode,
  };
}
