import { resolveRecursive } from "./resolveRecursive";
import type { ResolvedUuidToStyle } from "./types";

export function resolveEmbeddedUuids({
  uuidToStyle,
}: {
  uuidToStyle: Map<
    string,
    {
      style: string;
      dependsOn: Set<string>;
      uuid: string;
      className: string;
    }
  >;
}): ResolvedUuidToStyle {
  const resolved: ResolvedUuidToStyle = new Map();
  for (const target of uuidToStyle.values()) {
    resolveRecursive({
      resolvedStylesMap: resolved,
      target,
      unresolvedStyledMap: uuidToStyle,
    });
  }
  return resolved;
}
