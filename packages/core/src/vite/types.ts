import type { ResolvedModuleId, VirtualModuleId } from '@/types';

export type CssLookup = Map<
  ResolvedModuleId,
  {
    style: string;
    classNameToStyleMap: Map<string, { style: string }>;
  }
>;

export type JsToCssLookup = Map<
  string,
  {
    virtualId: VirtualModuleId;
    resolvedId: ResolvedModuleId;
    style: string;
  }
>;
