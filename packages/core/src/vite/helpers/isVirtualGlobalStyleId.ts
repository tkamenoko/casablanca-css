import { extractPathAndParamsFromId } from "@macrostyles/utils";
import type { VirtualGlobalStyleId } from "../types";
import { globalStyleIdPrefix } from "../types";

export function isVirtualGlobalStyleId(p: string): p is VirtualGlobalStyleId {
  const { path } = extractPathAndParamsFromId(p);
  return (
    path.startsWith(globalStyleIdPrefix) &&
    path.endsWith(".css") &&
    !path.endsWith(".module.css")
  );
}
