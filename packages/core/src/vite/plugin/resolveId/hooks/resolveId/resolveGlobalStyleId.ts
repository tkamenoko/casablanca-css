import {
  type ResolvedGlobalStyleId,
  buildResolvedGlobalStyleId,
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
    return buildResolvedGlobalStyleId({ id });
  }
  return null;
}
