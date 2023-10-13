import type { TaggedStyle } from '@macrostyles/utils';

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
