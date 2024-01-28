import { isResolvedCssModuleId } from '../helpers/isResolvedCssModuleId';
import { isVirtualCssModuleId } from '../helpers/isVirtualCssModuleId';
import { buildResolvedCssModuleIdFromVirtualCssModuleId } from '../helpers/buildResolvedCssModuleIdFromVirtualCssModuleId';
import type { ResolvedCssModuleId } from '../types';

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
