import type { VirtualCssModuleId } from '../types';
import { moduleIdPrefix } from '../types';

export function buildCssModuleImportId({
  importerPath: importerId,
  projectRoot,
}: {
  importerPath: string;
  projectRoot: string;
}): VirtualCssModuleId {
  const replaced = importerId.replace(projectRoot, '').replace(/^\//, '');
  return `${moduleIdPrefix}${replaced}.module.css`;
}
