import { buildResolvedGlobalStyleIdFromVirtualGlobalStyleId } from "#@/vite/helpers/buildResolvedGlobalStyleIdFromVirtualGlobalStyleId";
import { isResolvedGlobalStyleId } from "#@/vite/helpers/isResolvedGlobalStyleId";
import type { ResolvedGlobalStyleId } from "#@/vite/types";
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
