import type { ResolvedModuleId } from '@/types';

import { isResolvedId } from '../helpers/isResolvedId';
import { isVirtualModuleId } from '../helpers/isVirtualModuleId';
import { buildResolvedIdFromVirtualId } from '../helpers/buildResolvedIdFromVirtualId';

export function resolveCssId({ id }: { id: string }): ResolvedModuleId | null {
  if (isResolvedId(id)) {
    return id;
  }
  if (isVirtualModuleId(id)) {
    return buildResolvedIdFromVirtualId({ id });
  }
  return null;
}
