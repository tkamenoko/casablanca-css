import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import { isResolvedCssModuleId } from "#@/vite/resolvedCssModuleId";
import type { CssModulesLookup } from "#@/vite/types";

type LoadCssModuleReturn = { code: string; map: string | null };

export function loadCssModule({
  cssModulesLookup,
  id,
}: {
  id: string;
  cssModulesLookup: CssModulesLookup;
}): LoadCssModuleReturn | null {
  const { path } = extractPathAndParamsFromId(id);
  if (!isResolvedCssModuleId(path)) {
    return null;
  }

  const found = cssModulesLookup.get(path);
  if (!found) {
    return null;
  }

  return { code: found.style, map: found.map };
}
