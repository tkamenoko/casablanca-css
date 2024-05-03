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
  for (const { className, dependsOn, style, uuid } of uuidToStyle.values()) {
    let s = style;
    for (const depsUuid of dependsOn) {
      const d = resolved.get(depsUuid) ?? uuidToStyle.get(depsUuid);
      if (!d) {
        throw new Error(`Broken composition of ${className}`);
      }
      s = s.replaceAll(depsUuid, d.style);
      dependsOn.delete(depsUuid);
      for (const dependency of d.dependsOn) {
        dependsOn.add(dependency);
      }
    }
    resolved.set(uuid, { dependsOn, style: s, uuid });
  }
  return resolved;
}
