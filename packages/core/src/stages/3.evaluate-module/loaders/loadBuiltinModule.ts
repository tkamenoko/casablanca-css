import { isBuiltin } from "node:module";
import vm, { Module } from "node:vm";

export async function loadBuiltinModule({
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
  if (!isBuiltin(specifier)) {
    return null;
  }
  const normalizedSpecifier = specifier.startsWith("node:")
    ? specifier
    : `node:${specifier}`;
  const imported = await import(normalizedSpecifier).catch(() => null);
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
      identifier: `vm:module<builtin>(${specifier})`,
    },
  );
  const shortSpecifier = normalizedSpecifier.slice("node:".length);
  modulesCache.set(normalizedSpecifier, m);
  isBuiltin(shortSpecifier) ? modulesCache.set(shortSpecifier, m) : void 0;

  return m;
}
