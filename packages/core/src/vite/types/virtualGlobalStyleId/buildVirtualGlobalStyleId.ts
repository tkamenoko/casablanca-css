import { globalStyleIdPrefix, type VirtualGlobalStyleId } from "./types";

export function buildVirtualGlobalStyleId({
  importerPath: importerId,
  projectRoot,
}: {
  importerPath: string;
  projectRoot: string;
}): VirtualGlobalStyleId {
  const replaced = importerId.replace(projectRoot, "").replace(/^\//, "");
  return `${globalStyleIdPrefix}${replaced}.css`;
}
