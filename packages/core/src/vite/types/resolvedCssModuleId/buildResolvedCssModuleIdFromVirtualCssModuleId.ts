import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import type { VirtualCssModuleId } from "../virtualCssModuleId";
import { isVirtualCssModuleId } from "../virtualCssModuleId";
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
