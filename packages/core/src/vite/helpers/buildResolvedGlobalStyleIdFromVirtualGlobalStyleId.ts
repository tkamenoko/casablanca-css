import { extractPathAndParamsFromId } from "@macrostyles/utils";
import type { ResolvedGlobalStyleId, VirtualGlobalStyleId } from "../types";
import { isVirtualGlobalStyleId } from "./isVirtualGlobalStyleId";

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
