import { isBuiltin } from "node:module";
import vm from "node:vm";
import type { Loader } from "./types";

export const nodeBuiltinLoader: Loader = async ({
  modulesCache,
  specifier,
  referencingModule,
}) => {
  const cached = modulesCache.get(specifier);
  if (cached) {
    return { error: null, module: cached };
  }
  if (!isBuiltin(specifier)) {
    return {
      error: new Error(
        `NodeBuiltinLoader: "${specifier}" is not a builtin module.`,
      ),
      module: null,
    };
  }
  const normalizedSpecifier = specifier.startsWith("node:")
    ? specifier
    : `node:${specifier}`;
  const imported = await import(normalizedSpecifier).catch(() => null);
  if (!imported) {
    return {
      error: new Error(
        `NodeBuiltinLoader: Module "${specifier}" was not found in builtins.`,
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
      identifier: `vm:module<builtin>(${specifier})`,
    },
  );
  const shortSpecifier = normalizedSpecifier.slice("node:".length);
  modulesCache.set(normalizedSpecifier, m);
  isBuiltin(shortSpecifier) ? modulesCache.set(shortSpecifier, m) : void 0;

  return { error: null, module: m };
};
