import vm, { type Module } from "node:vm";
import type { LoadModuleReturn } from "../types";

export async function loadNodeModule({
  modulesCache,
  specifier,
  referencingModule,
}: {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
}): Promise<LoadModuleReturn> {
  const cached = modulesCache.get(specifier);
  if (cached) {
    return { error: null, module: cached };
  }
  const imported = await import(specifier).catch(() => null);
  if (!imported) {
    return {
      error: new Error(`Module "${specifier}" was not found in node_modules.`),
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
}
