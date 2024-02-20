import { extractPathAndParamsFromId } from "@casablanca/utils";
import { buildCssModuleImportId } from "#@/vite/helpers/buildCssModuleImportId";
import type { ResolvedCssModuleId } from "../types";
import { buildResolvedCssModuleIdFromVirtualCssModuleId } from "./buildResolvedCssModuleIdFromVirtualCssModuleId";

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
