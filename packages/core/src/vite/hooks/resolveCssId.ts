import { isResolvedId } from '../helpers/isResolvedId';
import { isVirtualModuleId } from '../helpers/isVirtualModuleId';
import { buildResolvedIdFromVirtualId } from '../helpers/buildResolvedIdFromVirtualId';
import type { ResolvedModuleId } from '../types';

export function resolveCssId({ id }: { id: string }): ResolvedModuleId | null {
  if (isResolvedId(id)) {
    return id;
  }
  if (isVirtualModuleId(id)) {
    return buildResolvedIdFromVirtualId({ id });
  }
  return null;
}
