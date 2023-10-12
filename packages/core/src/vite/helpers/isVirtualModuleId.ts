import { moduleIdPrefix } from '@/types';
import type { VirtualModuleId } from '@/types';

export function isVirtualModuleId(p: string): p is VirtualModuleId {
  return p.startsWith(moduleIdPrefix);
}
