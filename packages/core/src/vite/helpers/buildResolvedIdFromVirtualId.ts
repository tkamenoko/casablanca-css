import { extractPathAndParamsFromId } from '@macrostyles/utils';

import type { ResolvedCssModuleId, VirtualCssModuleId } from '../types';

import { isVirtualModuleId } from './isVirtualModuleId';

export function buildResolvedIdFromVirtualId({
  id,
}: {
  id: VirtualCssModuleId;
}): ResolvedCssModuleId {
  const { path } = extractPathAndParamsFromId(id);
  if (!isVirtualModuleId(path)) {
    throw new Error(`"${id}" has invalid path`);
  }
  return `\0${path}`;
}
