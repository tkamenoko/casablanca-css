import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import {
  type VirtualGlobalStyleId,
  isVirtualGlobalStyleId,
} from "../virtualGlobalStyleId";
import type { ResolvedGlobalStyleId } from "./types";

export function buildResolvedGlobalStyleId({
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
