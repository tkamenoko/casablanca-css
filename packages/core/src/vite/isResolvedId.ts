import { moduleIdPrefix, type ResolvedModuleId } from '../types';

export function isResolvedId(p: string): p is ResolvedModuleId {
  return p.startsWith('\0' + moduleIdPrefix);
}
