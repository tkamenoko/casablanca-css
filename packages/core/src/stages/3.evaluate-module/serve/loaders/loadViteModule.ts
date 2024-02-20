import vm, { type Module } from "node:vm";
import type { ViteDevServer } from "vite";

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
}): Promise<Module | null> {
  const cached = modulesCache.get(specifier);
  if (cached) {
    return cached;
  }
  // resolve id as vite-specific module
  const resolvedModule = server.moduleGraph.getModuleById(specifier);
  if (!resolvedModule) {
    return null;
  }
  const { url } = resolvedModule;
  const loaded = await server.ssrLoadModule(url).catch(() => null);
  if (!loaded) {
    return null;
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
  return m;
}
