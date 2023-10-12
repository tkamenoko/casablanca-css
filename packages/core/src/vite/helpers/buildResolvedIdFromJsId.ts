import { buildCssImportId } from '@/vite/helpers/buildCssImportId';

import type { ResolvedModuleId } from '../types';

import { extractPathAndParamsFromId } from './extractPathAndQueriesFromId';
import { buildResolvedIdFromVirtualId } from './buildResolvedIdFromVirtualId';

export function buildResolvedIdFromJsId({
  jsId,
  projectRoot,
}: {
  jsId: string;
  projectRoot: string;
}): ResolvedModuleId {
  const { path } = extractPathAndParamsFromId(jsId);
  const virtualId = buildCssImportId({ importerPath: path, projectRoot });
  return buildResolvedIdFromVirtualId({ id: virtualId });
}
