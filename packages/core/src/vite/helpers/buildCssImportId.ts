import { moduleIdPrefix } from '@/types';
import type { ModuleIdPrefix } from '@/types';

export function buildCssImportId({
  importerPath: importerId,
  projectRoot,
}: {
  importerPath: string;
  projectRoot: string;
}): `${ModuleIdPrefix}${string}` {
  const replaced = importerId.replace(projectRoot, '').replace(/^\//, '');
  return `${moduleIdPrefix}${replaced}.module.css`;
}
