import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import {
  type ResolvedCssModuleId,
  buildResolvedCssModuleIdFromVirtualCssModuleId,
} from "#@/vite/types/resolvedCssModuleId";
import { buildVirtualCssModuleId } from "#@/vite/types/virtualCssModuleId";

export function buildResolvedIdFromJsId({
  jsId,
  projectRoot,
}: {
  jsId: string;
  projectRoot: string;
}): ResolvedCssModuleId {
  const { path } = extractPathAndParamsFromId(jsId);
  const virtualId = buildVirtualCssModuleId({
    importerPath: path,
    projectRoot,
  });
  return buildResolvedCssModuleIdFromVirtualCssModuleId({ id: virtualId });
}
