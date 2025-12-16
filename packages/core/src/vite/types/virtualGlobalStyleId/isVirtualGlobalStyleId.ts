import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import { globalStyleIdPrefix, type VirtualGlobalStyleId } from "./types";

export function isVirtualGlobalStyleId(p: string): p is VirtualGlobalStyleId {
  const { path } = extractPathAndParamsFromId(p);
  return (
    path.startsWith(globalStyleIdPrefix) &&
    path.endsWith(".css") &&
    !path.endsWith(".module.css")
  );
}
