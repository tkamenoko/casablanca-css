import type { ModuleIdPrefix } from '../types';

const moduleIdPrefix: ModuleIdPrefix = 'macrostyles:';

export function isResolvedId(p: string): p is `${ModuleIdPrefix}${string}` {
  return p.startsWith(moduleIdPrefix);
}
