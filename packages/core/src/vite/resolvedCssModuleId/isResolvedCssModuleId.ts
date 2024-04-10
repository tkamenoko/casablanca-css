import { extractPathAndParamsFromId } from "@casablanca/utils";
import { isVirtualCssModuleId } from "../virtualCssModuleId";
import type { ResolvedCssModuleId } from "./types";

export function isResolvedCssModuleId(id: string): id is ResolvedCssModuleId {
  const { path } = extractPathAndParamsFromId(id);
  if (!path.startsWith("\0")) {
    return false;
  }
  return isVirtualCssModuleId(path.slice(1));
}
