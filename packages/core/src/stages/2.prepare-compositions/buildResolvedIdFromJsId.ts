import { extractPathAndParamsFromId } from "@casablanca/utils";
import { buildCssModuleImportId } from "#@/vite/helpers/buildCssModuleImportId";
import { buildResolvedCssModuleIdFromVirtualCssModuleId } from "#@/vite/helpers/buildResolvedCssModuleIdFromVirtualCssModuleId";
import type { ResolvedCssModuleId } from "#@/vite/types";

export function buildResolvedIdFromJsId({
  jsId,
  projectRoot,
}: {
  jsId: string;
  projectRoot: string;
}): ResolvedCssModuleId {
  const { path } = extractPathAndParamsFromId(jsId);
  const virtualId = buildCssModuleImportId({ importerPath: path, projectRoot });
  return buildResolvedCssModuleIdFromVirtualCssModuleId({ id: virtualId });
}
