import { extractPathAndParamsFromId } from "@macrostyles/utils";
import { isResolvedCssModuleId } from "../../helpers/isResolvedCssModuleId";
import type { CssModulesLookup } from "../../types";

export function loadCssModule({
  cssModulesLookup,
  id,
}: {
  id: string;
  cssModulesLookup: CssModulesLookup;
}): string | null {
  const { path } = extractPathAndParamsFromId(id);
  if (!isResolvedCssModuleId(path)) {
    return null;
  }

  const found = cssModulesLookup.get(path);
  if (!found) {
    return null;
  }
  return found.style;
}
