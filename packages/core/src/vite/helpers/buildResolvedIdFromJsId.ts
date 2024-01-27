import { extractPathAndParamsFromId } from '@macrostyles/utils';

import { buildCssModuleImportId } from '@/vite/helpers/buildCssImportId';

import type { ResolvedCssModuleId } from '../types';

import { buildResolvedIdFromVirtualId } from './buildResolvedIdFromVirtualId';

export function buildResolvedIdFromJsId({
  jsId,
  projectRoot,
}: {
  jsId: string;
  projectRoot: string;
}): ResolvedCssModuleId {
  const { path } = extractPathAndParamsFromId(jsId);
  const virtualId = buildCssModuleImportId({ importerPath: path, projectRoot });
  return buildResolvedIdFromVirtualId({ id: virtualId });
}
