import type { VirtualGlobalStyleId } from "../types";
import { globalStyleIdPrefix } from "../types";

export function buildGlobalStyleImportId({
  importerPath: importerId,
  projectRoot,
}: {
  importerPath: string;
  projectRoot: string;
}): VirtualGlobalStyleId {
  const replaced = importerId.replace(projectRoot, "").replace(/^\//, "");
  return `${globalStyleIdPrefix}${replaced}.css`;
}
