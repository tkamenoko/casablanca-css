import type { ResolvedUuidToStyle } from "./types";

export function resolveRecursive({
  resolvedStylesMap,
  target: { className, dependsOn, style, uuid },
  unresolvedStyledMap,
}: {
  target: {
    style: string;
    dependsOn: Set<string>;
    uuid: string;
    className: string;
  };
  resolvedStylesMap: ResolvedUuidToStyle;
  unresolvedStyledMap: Map<
    string,
    {
      style: string;
      dependsOn: Set<string>;
      uuid: string;
      className: string;
    }
  >;
}): { resolvedStyle: string; uuid: string; className: string } {
  let s = style;

  for (const depsUuid of dependsOn) {
    const resolved = resolvedStylesMap.get(depsUuid);
    if (resolved) {
      s = s.replaceAll(resolved.uuid, resolved.style);
      continue;
    }
    const unresolved = unresolvedStyledMap.get(depsUuid);
    if (!unresolved) {
      throw new Error(`Broken composition of ${className}`);
    }

    const resolvedDepsStyle = resolveRecursive({
      resolvedStylesMap,
      target: unresolved,
      unresolvedStyledMap,
    });
    s = s.replaceAll(resolvedDepsStyle.uuid, resolvedDepsStyle.resolvedStyle);
  }
  resolvedStylesMap.set(uuid, { style: s, uuid, className });
  unresolvedStyledMap.set(uuid, {
    className,
    dependsOn: new Set(),
    style: s,
    uuid,
  });
  return { resolvedStyle: s, uuid, className };
}
