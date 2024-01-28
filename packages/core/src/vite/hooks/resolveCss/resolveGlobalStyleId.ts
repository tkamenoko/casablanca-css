import type { ResolvedGlobalStyleId } from '../../types';
import { isResolvedGlobalStyleId } from '../../helpers/isResolvedGlobalStyleId';
import { isVirtualGlobalStyleId } from '../../helpers/isVirtualGlobalStyleId';
import { buildResolvedGlobalStyleIdFromVirtualGlobalStyleId } from '../../helpers/buildResolvedGlobalStyleIdFromVirtualGlobalStyleId';

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
