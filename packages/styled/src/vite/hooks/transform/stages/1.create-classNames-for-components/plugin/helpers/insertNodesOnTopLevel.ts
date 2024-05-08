import type { NodePath } from "@babel/core";
import type { NodePaths } from "@babel/traverse";

type Nodes = Parameters<NodePath["insertAfter"]>[0];

export function insertNodeOnTopLevel(
  path: NodePath,
  nodes: Nodes,
  position: "before" | "after",
): NodePaths<Nodes> {
  const targetPath = path.parentPath?.isExportDeclaration()
    ? path.parentPath
    : path;
  if (position === "before") {
    return targetPath.insertBefore(nodes);
  }
  return targetPath.insertAfter(nodes);
}
