import { extractPathAndParamsFromId } from "@casablanca/utils";
import type { ResolvedGlobalStyleId } from "../types";
import type { VirtualGlobalStyleId } from "../virtualGlobalStyleId";
import { isVirtualGlobalStyleId } from "../virtualGlobalStyleId";

export function buildResolvedGlobalStyleIdFromVirtualGlobalStyleId({
  id,
}: {
  id: VirtualGlobalStyleId;
}): ResolvedGlobalStyleId {
  const { path } = extractPathAndParamsFromId(id);
  if (!isVirtualGlobalStyleId(path)) {
    throw new Error(`"${id}" has invalid path`);
  }
  return `\0${path}`;
}
