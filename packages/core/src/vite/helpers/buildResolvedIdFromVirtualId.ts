import type { ResolvedModuleId, VirtualModuleId } from '@/types';

import { extractPathAndParamsFromId } from './extractPathAndQueriesFromId';
import { isVirtualModuleId } from './isVirtualModuleId';

export function buildResolvedIdFromVirtualId({
  id,
}: {
  id: VirtualModuleId;
}): ResolvedModuleId {
  const { path } = extractPathAndParamsFromId(id);
  if (!isVirtualModuleId(path)) {
    throw new Error(`"${id}" has invalid path`);
  }
  return `\0${path}`;
}
