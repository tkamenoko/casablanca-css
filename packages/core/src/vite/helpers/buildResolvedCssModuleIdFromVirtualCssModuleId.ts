import { extractPathAndParamsFromId } from "@macrostyles/utils";
import type { ResolvedCssModuleId, VirtualCssModuleId } from "../types";
import { isVirtualCssModuleId } from "./isVirtualCssModuleId";

export function buildResolvedCssModuleIdFromVirtualCssModuleId({
  id,
}: {
  id: VirtualCssModuleId;
}): ResolvedCssModuleId {
  const { path } = extractPathAndParamsFromId(id);
  if (!isVirtualCssModuleId(path)) {
    throw new Error(`"${id}" has invalid path`);
  }
  return `\0${path}`;
}
