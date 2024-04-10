import { extractPathAndParamsFromId } from "@casablanca/utils";
import type { ResolvedGlobalStyleId } from "../types";
import { isVirtualGlobalStyleId } from "../virtualGlobalStyleId";

export function isResolvedGlobalStyleId(
  id: string,
): id is ResolvedGlobalStyleId {
  const { path } = extractPathAndParamsFromId(id);
  if (!path.startsWith("\0")) {
    return false;
  }
  return isVirtualGlobalStyleId(path.slice(1));
}
