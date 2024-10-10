import { isBuiltin } from "node:module";
import vm, { type Module } from "node:vm";
import type { LoadModuleReturn } from "../types";

export async function loadBuiltinModule({
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
  if (!isBuiltin(specifier)) {
    return {
      error: new Error(`"${specifier}" is not a builtin module.`),
      module: null,
    };
  }
  const normalizedSpecifier = specifier.startsWith("node:")
    ? specifier
    : `node:${specifier}`;
  const imported = await import(normalizedSpecifier).catch(() => null);
  if (!imported) {
    return {
      error: new Error(`Module "${specifier}" was not found in builtins.`),
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
      identifier: `vm:module<builtin>(${specifier})`,
    },
  );
  const shortSpecifier = normalizedSpecifier.slice("node:".length);
  modulesCache.set(normalizedSpecifier, m);
  isBuiltin(shortSpecifier) ? modulesCache.set(shortSpecifier, m) : void 0;

  return { error: null, module: m };
}
