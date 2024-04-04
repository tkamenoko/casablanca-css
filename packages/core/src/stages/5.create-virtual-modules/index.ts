import {
  type BuildForDevArgs,
  type BuildForDevReturn,
  buildForDev,
} from "./dev";
import {
  type BuildForProductionArgs,
  type BuildForProductionReturn,
  buildForProduction,
} from "./production";

type CreateVirtualModulesArgs = BuildForDevArgs | BuildForProductionArgs;

export type CreateVirtualModulesReturn =
  | BuildForDevReturn
  | BuildForProductionReturn;

export function createVirtualModules({
  evaluatedCssModuleStyles,
  evaluatedGlobalStyles,
  importerPath,
  projectRoot,
  originalInfo,
}: CreateVirtualModulesArgs): CreateVirtualModulesReturn {
  if (originalInfo) {
    return buildForDev({
      evaluatedCssModuleStyles,
      evaluatedGlobalStyles,
      importerPath,
      projectRoot,
      originalInfo,
    });
  }

  return buildForProduction({
    evaluatedCssModuleStyles,
    evaluatedGlobalStyles,
    importerPath,
    projectRoot,
    originalInfo: null,
  });
}
