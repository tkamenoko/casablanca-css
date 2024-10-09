import vm, { type Module } from "node:vm";
import type { ViteDevServer } from "vite";
import type { LoadModuleReturn } from "../../types";

export async function loadViteModule({
  modulesCache,
  specifier,
  referencingModule,
  server,
}: {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
  server: ViteDevServer;
}): Promise<LoadModuleReturn> {
  const cached = modulesCache.get(specifier);
  if (cached) {
    return { error: null, module: cached };
  }
  // resolve id as vite-specific module
  const resolvedModule = server.moduleGraph.getModuleById(specifier);
  if (!resolvedModule) {
    return {
      error: new Error(`Failed to resolve "${specifier}"`),
      module: null,
    };
  }
  const { url } = resolvedModule;
  const { loaded, error } = await server
    .ssrLoadModule(url)
    .then((r) => ({ loaded: r, error: null }))
    .catch((e) => ({ loaded: null, error: e }));
  if (!loaded) {
    return { error, module: null };
  }

  const exportNames = Object.keys(loaded);
  const m = new vm.SyntheticModule(
    exportNames,
    () => {
      for (const exportName of exportNames) {
        m.setExport(exportName, loaded[exportName]);
      }
    },
    {
      context: referencingModule.context,
      identifier: `vm:module<vite>(${specifier})`,
    },
  );
  modulesCache.set(specifier, m);
  return { error: null, module: m };
}
