import { extractPathAndParamsFromId } from '@macrostyles/utils';

import { isResolvedCssModuleId } from '../helpers/isResolvedCssModuleId';
import type { CssModulesLookup } from '../types';

export function loadCssModule({
  cssLookup,
  id,
}: {
  id: string;
  cssLookup: CssModulesLookup;
}): string | null {
  const { path } = extractPathAndParamsFromId(id);
  if (!isResolvedCssModuleId(path)) {
    return null;
  }

  const found = cssLookup.get(path);
  if (!found) {
    return null;
  }
  return found.style;
}
