import vm from "node:vm";
import type { Loader } from "@casablanca-css/eval/loaders";
import type { ViteDevServer } from "vite";

export function createRelativeLoader(server: ViteDevServer): Loader {
  const loader: Loader = async ({
    basePath,
    specifier,
    modulesCache,
    referencingModule,
  }) => {
    // resolve id as relative path
    const resolvedRelativePath = await server.pluginContainer.resolveId(
      specifier,
      basePath,
    );

    if (!resolvedRelativePath) {
      return {
        error: new Error(`Failed to resolve "${specifier}"`),
        module: null,
      };
    }
    const cached = modulesCache.get(resolvedRelativePath.id);
    if (cached) {
      return { error: null, module: cached };
    }

    const resolvedModule = server.moduleGraph.getModuleById(
      resolvedRelativePath.id,
    );

    const url = resolvedModule?.url ?? resolvedRelativePath.id;

    const { error, loaded } = await server
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
        identifier: `vm:module<relative>(${specifier})`,
      },
    );
    modulesCache.set(specifier, m);
    return { error: null, module: m };
  };
  return loader;
}
