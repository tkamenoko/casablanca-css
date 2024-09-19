import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import { type VirtualCssModuleId, cssModuleIdPrefix } from "./types";

export function isVirtualCssModuleId(p: string): p is VirtualCssModuleId {
  const { path } = extractPathAndParamsFromId(p);
  return path.startsWith(cssModuleIdPrefix) && path.endsWith(".module.css");
}
