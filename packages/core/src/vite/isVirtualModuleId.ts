import { moduleIdPrefix } from '../types';
import type { ModuleIdPrefix } from '../types';

export function isVirtualModuleId(
  p: string,
): p is `${ModuleIdPrefix}${string}` {
  return p.startsWith(moduleIdPrefix);
}
