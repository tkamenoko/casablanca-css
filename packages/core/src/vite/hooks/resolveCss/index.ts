import type { ResolvedCssModuleId, ResolvedGlobalStyleId } from '@/vite/types';

import { resolveCssModuleId } from './resolveCssModuleId';
import { resolveGlobalStyleId } from './resolveGlobalStyleId';

export function resolveCssId({
  id,
}: {
  id: string;
}): ResolvedCssModuleId | ResolvedGlobalStyleId | null {
  return resolveCssModuleId({ id }) ?? resolveGlobalStyleId({ id });
}
