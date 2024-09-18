import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import { isVirtualGlobalStyleId } from "../virtualGlobalStyleId";
import type { ResolvedGlobalStyleId } from "./types";

export function isResolvedGlobalStyleId(
  id: string,
): id is ResolvedGlobalStyleId {
  const { path } = extractPathAndParamsFromId(id);
  if (!path.startsWith("\0")) {
    return false;
  }
  return isVirtualGlobalStyleId(path.slice(1));
}
