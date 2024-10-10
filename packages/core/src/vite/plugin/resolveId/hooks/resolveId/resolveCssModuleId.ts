import {
  type ResolvedCssModuleId,
  buildResolvedCssModuleId,
  isResolvedCssModuleId,
} from "#@/vite/types/resolvedCssModuleId";
import { isVirtualCssModuleId } from "#@/vite/types/virtualCssModuleId";

export function resolveCssModuleId({
  id,
}: {
  id: string;
}): ResolvedCssModuleId | null {
  if (isResolvedCssModuleId(id)) {
    return id;
  }
  if (isVirtualCssModuleId(id)) {
    return buildResolvedCssModuleId({ id });
  }
  return null;
}
