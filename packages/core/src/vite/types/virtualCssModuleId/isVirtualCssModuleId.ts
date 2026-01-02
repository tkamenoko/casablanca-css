import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import { cssModuleIdPrefix, type VirtualCssModuleId } from "./types";

export function isVirtualCssModuleId(p: string): p is VirtualCssModuleId {
  const { path } = extractPathAndParamsFromId(p);
  return path.startsWith(cssModuleIdPrefix) && path.endsWith(".module.css");
}
