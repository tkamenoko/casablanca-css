import type { VirtualModuleId } from '../types';
import { moduleIdPrefix } from '../types';

export function isVirtualModuleId(p: string): p is VirtualModuleId {
  return p.startsWith(moduleIdPrefix);
}
