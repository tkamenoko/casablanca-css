import type { ResolvedCssModuleId } from "#@/vite/resolvedCssModuleId";
import type { CssModulesLookup } from "#@/vite/types";
import type { MapElement } from "./types";

export function getResolvedMapElement({
  cssModulesLookup,
  resolvedId,
  className,
}: {
  cssModulesLookup: CssModulesLookup;
  resolvedId: ResolvedCssModuleId;
  className: string;
}): MapElement {
  const style = cssModulesLookup
    .get(resolvedId)
    ?.classNameToStyleMap.get(className)?.style;
  if (!style) {
    throw new Error(`Broken composition of ${className}`);
  }
  return {
    style,
    dependsOn: new Set<string>(),
  };
}
