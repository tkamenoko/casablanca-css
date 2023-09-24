import {
  moduleIdPrefix,
  resolvedPrefix,
  type ResolvedModuleId,
} from '../types';

export function isResolvedId(p: string): p is ResolvedModuleId {
  return p.startsWith(resolvedPrefix + moduleIdPrefix);
}
