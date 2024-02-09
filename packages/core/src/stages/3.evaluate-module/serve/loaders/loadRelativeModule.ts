import vm, { Module } from "node:vm";
import { ViteDevServer } from "vite";

export async function loadRelativeModule({
  modulesCache,
  specifier,
  referencingModule,
  server,
  basePath,
}: {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
  server: ViteDevServer;
  basePath: string;
}): Promise<Module | null> {
  // resolve id as relative path
  const resolvedRelativePath = await server.pluginContainer.resolveId(
    specifier,
    basePath,
  );

  if (!resolvedRelativePath) {
    return null;
  }
  const cached = modulesCache.get(resolvedRelativePath.id);
  if (cached) {
    return cached;
  }

  const resolvedModule = server.moduleGraph.getModuleById(
    resolvedRelativePath.id,
  );

  const url = resolvedModule?.url ?? resolvedRelativePath.id;

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
      identifier: `vm:module<relative>(${specifier})`,
    },
  );
  modulesCache.set(specifier, m);
  return m;
}
