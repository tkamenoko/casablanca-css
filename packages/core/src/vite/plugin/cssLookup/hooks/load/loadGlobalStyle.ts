import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import { isResolvedGlobalStyleId } from "#@/vite/resolvedGlobalStyleId";
import type { GlobalStylesLookup } from "../../types";

type LoadGlobalStyleReturn = { code: string; map: string | null };

export function loadGlobalStyle({
  globalStylesLookup,
  id,
}: {
  id: string;
  globalStylesLookup: GlobalStylesLookup;
}): LoadGlobalStyleReturn | null {
  const { path } = extractPathAndParamsFromId(id);
  if (!isResolvedGlobalStyleId(path)) {
    return null;
  }

  const found = globalStylesLookup.get(path);
  if (!found) {
    return null;
  }

  return { code: found.style, map: found.map };
}
