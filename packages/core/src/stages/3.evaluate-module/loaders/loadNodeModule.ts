import vm, { type Module } from "node:vm";

export async function loadNodeModule({
  modulesCache,
  specifier,
  referencingModule,
}: {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
}): Promise<Module | null> {
  const cached = modulesCache.get(specifier);
  if (cached) {
    return cached;
  }
  const imported = await import(specifier).catch(() => null);
  if (!imported) {
    return null;
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
  return m;
}
