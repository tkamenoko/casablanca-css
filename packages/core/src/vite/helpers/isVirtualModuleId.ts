import type { VirtualCssModuleId } from '../types';
import { moduleIdPrefix } from '../types';

export function isVirtualModuleId(p: string): p is VirtualCssModuleId {
  return p.startsWith(moduleIdPrefix);
}
