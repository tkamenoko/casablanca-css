import { type VirtualCssModuleId, cssModuleIdPrefix } from "./types";

export function buildVirtualCssModuleId({
  importerPath: importerId,
  projectRoot,
}: {
  importerPath: string;
  projectRoot: string;
}): VirtualCssModuleId {
  const replaced = importerId.replace(projectRoot, "").replace(/^\//, "");
  return `${cssModuleIdPrefix}${replaced}.module.css`;
}
