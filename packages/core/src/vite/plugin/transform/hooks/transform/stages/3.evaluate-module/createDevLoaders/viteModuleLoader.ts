import vm from "node:vm";
import type { Loader } from "@casablanca-css/eval/loaders";
import type { ViteDevServer } from "vite";

export function createViteModuleLoader(server: ViteDevServer): Loader {
  const loader: Loader = async ({
    modulesCache,
    referencingModule,
    specifier,
  }) => {
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
  };
  return loader;
}
