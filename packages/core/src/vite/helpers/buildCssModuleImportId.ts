import type { VirtualCssModuleId } from "../types";
import { cssModuleIdPrefix } from "../types";

export function buildCssModuleImportId({
  importerPath: importerId,
  projectRoot,
}: {
  importerPath: string;
  projectRoot: string;
}): VirtualCssModuleId {
  const replaced = importerId.replace(projectRoot, "").replace(/^\//, "");
  return `${cssModuleIdPrefix}${replaced}.module.css`;
}
