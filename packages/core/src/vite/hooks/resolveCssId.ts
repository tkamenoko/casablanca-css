import { isResolvedId } from '../helpers/isResolvedId';
import { isVirtualModuleId } from '../helpers/isVirtualModuleId';
import { buildResolvedIdFromVirtualId } from '../helpers/buildResolvedIdFromVirtualId';
import type { ResolvedCssModuleId } from '../types';

export function resolveCssId({
  id,
}: {
  id: string;
}): ResolvedCssModuleId | null {
  if (isResolvedId(id)) {
    return id;
  }
  if (isVirtualModuleId(id)) {
    return buildResolvedIdFromVirtualId({ id });
  }
  return null;
}
