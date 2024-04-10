import { extractPathAndParamsFromId } from "@casablanca/utils";
import { isResolvedGlobalStyleId } from "#@/vite/resolvedGlobalStyleId";
import type { GlobalStylesLookup } from "#@/vite/types";

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
