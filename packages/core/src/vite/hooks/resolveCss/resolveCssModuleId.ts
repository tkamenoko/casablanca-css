import { buildResolvedCssModuleIdFromVirtualCssModuleId } from "#@/vite/resolvedCssModuleId/buildResolvedCssModuleIdFromVirtualCssModuleId";
import { isResolvedCssModuleId } from "#@/vite/resolvedCssModuleId/isResolvedCssModuleId";
import type { ResolvedCssModuleId } from "#@/vite/resolvedCssModuleId/types";
import { isVirtualCssModuleId } from "#@/vite/virtualCssModuleId";

export function resolveCssModuleId({
  id,
}: {
  id: string;
}): ResolvedCssModuleId | null {
  if (isResolvedCssModuleId(id)) {
    return id;
  }
  if (isVirtualCssModuleId(id)) {
    return buildResolvedCssModuleIdFromVirtualCssModuleId({ id });
  }
  return null;
}
