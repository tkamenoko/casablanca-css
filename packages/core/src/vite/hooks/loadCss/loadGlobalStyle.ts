import { extractPathAndParamsFromId } from '@macrostyles/utils';

import { isResolvedGlobalStyleId } from '@/vite/helpers/isResolvedGlobalStyleId';
import type { GlobalStylesLookup } from '@/vite/types';

export function loadGlobalStyle({
  globalStylesLookup,
  id,
}: {
  id: string;
  globalStylesLookup: GlobalStylesLookup;
}): string | null {
  const { path } = extractPathAndParamsFromId(id);
  if (!isResolvedGlobalStyleId(path)) {
    return null;
  }

  const found = globalStylesLookup.get(path);
  if (!found) {
    return null;
  }
  return found.style;
}