import { extractPathAndParamsFromId } from "@casablanca/utils";
import { buildVirtualCssModuleId } from "#@/vite/cssModuleId";
import { buildResolvedCssModuleIdFromVirtualCssModuleId } from "#@/vite/resolvedCssModuleId";
import type { ResolvedCssModuleId } from "#@/vite/resolvedCssModuleId";

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
