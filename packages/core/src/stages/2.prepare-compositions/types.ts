import type { TaggedStyle } from '@/types';
import type { ResolvedModuleId } from '@/vite/types';

export type UuidToStylesMap = Map<
  string,
  {
    resolvedId: ResolvedModuleId | null;
    varName: string;
    className?: string;
    value?: TaggedStyle<unknown>;
  }
>;
