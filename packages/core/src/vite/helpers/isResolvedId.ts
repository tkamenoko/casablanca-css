import { extractPathAndParamsFromId } from '@macrostyles/utils';

import type { ResolvedModuleId } from '../types';

import { isVirtualModuleId } from './isVirtualModuleId';

export function isResolvedId(id: string): id is ResolvedModuleId {
  const { path } = extractPathAndParamsFromId(id);
  if (!path.startsWith('\0')) {
    return false;
  }
  return isVirtualModuleId(path.slice(1));
}
