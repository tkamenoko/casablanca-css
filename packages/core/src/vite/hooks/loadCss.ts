import { extractPathAndParamsFromId } from '@macrostyles/utils';

import { isResolvedId } from '../helpers/isResolvedId';
import type { CssLookup } from '../types';

export function loadCss({
  cssLookup,
  id,
}: {
  id: string;
  cssLookup: CssLookup;
}): string | null {
  const { path } = extractPathAndParamsFromId(id);
  if (!isResolvedId(path)) {
    return null;
  }

  const found = cssLookup.get(path);
  if (!found) {
    return null;
  }
  return found.style;
}
