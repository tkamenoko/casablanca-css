import { extractPathAndParamsFromId } from "@casablanca/utils";
import type { ResolvedCssModuleId } from "../types";
import { isVirtualCssModuleId } from "./isVirtualCssModuleId";

export function isResolvedCssModuleId(id: string): id is ResolvedCssModuleId {
  const { path } = extractPathAndParamsFromId(id);
  if (!path.startsWith("\0")) {
    return false;
  }
  return isVirtualCssModuleId(path.slice(1));
}
