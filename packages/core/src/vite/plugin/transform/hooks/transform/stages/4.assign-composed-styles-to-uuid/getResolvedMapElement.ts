import type { CssLookupApi } from "#@/vite/plugin/cssLookup";
import type { ResolvedCssModuleId } from "#@/vite/resolvedCssModuleId";
import type { MapElement } from "./types";

export function getResolvedMapElement({
  cssModulesLookupApi,
  resolvedId,
  className,
}: {
  cssModulesLookupApi: CssLookupApi["cssModule"];
  resolvedId: ResolvedCssModuleId;
  className: string;
}): MapElement {
  const style = cssModulesLookupApi
    .getFromResolvedId(resolvedId)
    ?.classNameToStyleMap.get(className)?.style;
  if (!style) {
    throw new Error(`Broken composition of ${className}`);
  }
  return {
    style,
    dependsOn: new Set<string>(),
  };
}
