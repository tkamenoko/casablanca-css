import vm from "node:vm";
import type { Loader } from "./types";

export const nodeModuleLoader: Loader = async ({
  modulesCache,
  specifier,
  referencingModule,
}) => {
  const cached = modulesCache.get(specifier);
  if (cached) {
    return { error: null, module: cached };
  }
  const imported = await import(specifier).catch(() => null);
  if (!imported) {
    return {
      error: new Error(
        `NodeModuleLoader: Module "${specifier}" was not found in node_modules.`,
      ),
      module: null,
    };
  }
  const exportNames = Object.keys(imported);
  const m = new vm.SyntheticModule(
    exportNames,
    () => {
      for (const exportName of exportNames) {
        m.setExport(exportName, imported[exportName]);
      }
    },
    {
      context: referencingModule.context,
      identifier: `vm:module<node>(${specifier})`,
    },
  );
  modulesCache.set(specifier, m);
  return { error: null, module: m };
};
