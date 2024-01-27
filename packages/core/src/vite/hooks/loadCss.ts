import { extractPathAndParamsFromId } from '@macrostyles/utils';

import { isResolvedId } from '../helpers/isResolvedId';
import type { CssModulesLookup } from '../types';

export function loadCss({
  cssLookup,
  id,
}: {
  id: string;
  cssLookup: CssModulesLookup;
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
