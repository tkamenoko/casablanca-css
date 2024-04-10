import { extractPathAndParamsFromId } from "@casablanca/utils";
import type { VirtualCssModuleId } from "../cssModuleId";
import { isVirtualCssModuleId } from "../cssModuleId/isVirtualCssModuleId";
import type { ResolvedCssModuleId } from "./types";

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
