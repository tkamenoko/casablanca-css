import { buildResolvedGlobalStyleIdFromVirtualGlobalStyleId } from "../../helpers/buildResolvedGlobalStyleIdFromVirtualGlobalStyleId";
import { isResolvedGlobalStyleId } from "../../helpers/isResolvedGlobalStyleId";
import { isVirtualGlobalStyleId } from "../../helpers/isVirtualGlobalStyleId";
import type { ResolvedGlobalStyleId } from "../../types";

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
