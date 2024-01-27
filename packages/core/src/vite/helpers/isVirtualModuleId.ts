import type { VirtualCssModuleId } from '../types';
import { cssModuleIdPrefix } from '../types';

export function isVirtualModuleId(p: string): p is VirtualCssModuleId {
  return p.startsWith(cssModuleIdPrefix);
}
