import { extractPathAndParamsFromId } from "@macrostyles/utils";
import type { VirtualCssModuleId } from "../types";
import { cssModuleIdPrefix } from "../types";

export function isVirtualCssModuleId(p: string): p is VirtualCssModuleId {
  const { path } = extractPathAndParamsFromId(p);
  return path.startsWith(cssModuleIdPrefix) && path.endsWith(".module.css");
}
