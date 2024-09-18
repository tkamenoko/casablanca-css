import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import { buildResolvedCssModuleIdFromVirtualCssModuleId } from "#@/vite/resolvedCssModuleId";
import type { ResolvedCssModuleId } from "#@/vite/resolvedCssModuleId";
import { buildVirtualCssModuleId } from "#@/vite/virtualCssModuleId";

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
