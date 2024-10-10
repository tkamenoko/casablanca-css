import {
  type ResolvedGlobalStyleId,
  buildResolvedGlobalStyleIdFromVirtualGlobalStyleId,
  isResolvedGlobalStyleId,
} from "#@/vite/types/resolvedGlobalStyleId";
import { isVirtualGlobalStyleId } from "#@/vite/types/virtualGlobalStyleId";

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
