import type { NodePath, types } from "@babel/core";
import type { TaggedTemplateExpression } from "@babel/types";
import { isCasablancaImport } from "@casablanca/utils";

export function isCasablancaStyledTemplate(
  path: NodePath<types.Expression | null | undefined>,
): path is NodePath<TaggedTemplateExpression> {
  if (!path.isTaggedTemplateExpression()) {
    return false;
  }
  const tagFunction = path.get("tag");
  if (!tagFunction.isCallExpression()) {
    return false;
  }
  const tagId = tagFunction.get("callee");
  if (!tagId.isIdentifier()) {
    return false;
  }
  const tagBinding = path.scope.getBinding(tagId.node.name);
  if (!tagBinding) {
    return false;
  }
  const importDec = tagBinding.path.parentPath;

  if (!(importDec && isCasablancaImport(importDec, "react"))) {
    return false;
  }
  const imported = tagBinding.path.get("imported");

  if (Array.isArray(imported)) {
    return false;
  }

  if (!imported.isIdentifier()) {
    return false;
  }
  return imported.node.name === "styled";
}
