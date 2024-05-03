import type { ResolvedGlobalStyleId } from "#@/vite/resolvedGlobalStyleId";
import { buildResolvedGlobalStyleIdFromVirtualGlobalStyleId } from "#@/vite/resolvedGlobalStyleId";
import { isResolvedGlobalStyleId } from "#@/vite/resolvedGlobalStyleId";
import { isVirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";

export function resolveGlobalStyleId({
  id,
}: {
  id: string;
}): ResolvedGlobalStyleId | null {
  if (isResolvedGlobalStyleId(id)) {
    return id;
  }
  if (isVirtualGlobalStyleId(id)) {
    return buildResolvedGlobalStyleIdFromVirtualGlobalStyleId({ id });
  }
  return null;
}
