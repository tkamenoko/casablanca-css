import { randomUUID } from "node:crypto";
import type { NodePath, types } from "@babel/core";
import type {
  ComposeArg,
  EmbeddedToClassNameMap,
  UuidToStylesMap,
} from "./types";

export function collectComposeArgsValues({
  ids,
  embeddedToClassNameMap,
  uuidToStylesMap,
}: {
  ids: NodePath<types.Identifier>[];
  embeddedToClassNameMap: EmbeddedToClassNameMap;
  uuidToStylesMap: UuidToStylesMap;
}): ComposeArg[] {
  const composeArgs: ComposeArg[] = [];
  for (const id of ids) {
    const name = id.node.name;
    const {
      className,
      cssId,
      uuid = randomUUID(),
    } = embeddedToClassNameMap.get(name) ?? {};
    const resolvedId = cssId ?? null;
    const varName = name;
    uuidToStylesMap.set(uuid, {
      varName,
      className: className ?? name,
      resolvedId,
    });
    composeArgs.push({
      resolvedId,
      uuid,
      varName,
      valueId: id.node,
    });
  }
  return composeArgs;
}
