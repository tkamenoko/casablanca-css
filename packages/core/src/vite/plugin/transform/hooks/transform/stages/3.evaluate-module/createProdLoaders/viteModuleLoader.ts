import vm from "node:vm";
import type { Loader } from "@casablanca-css/eval/loaders";
import type { TransformContext } from "../types";
import { buildInitializeImportMeta } from "./initializeImportMeta";

export function createViteModuleLoader(ctx: TransformContext): Loader {
  const loader: Loader = async ({
    importMeta,
    modulesCache,
    referencingModule,
    specifier,
  }) => {
    const cached = modulesCache.get(specifier);
    if (cached) {
      return { error: null, module: cached };
    }
    // resolve id as vite-specific module
    const loaded = await ctx
      .load({
        id: specifier,
        resolveDependencies: true,
      })
      .then((r) =>
        r.code
          ? { code: r.code, error: null }
          : {
              code: null,
              error: new Error(`Failed to load "${specifier}"`),
            },
      )
      .catch((e) => ({ code: null, error: e }));
    if (!loaded.code) {
      return { error: loaded.error, module: null };
    }

    const m = new vm.SourceTextModule(loaded.code, {
      context: referencingModule.context,
      identifier: `vm:module<vite>(${specifier})`,
      initializeImportMeta: buildInitializeImportMeta({
        contextifiedObject: referencingModule.context,
        importMeta,
      }),
    });
    modulesCache.set(specifier, m);
    return { error: null, module: m };
  };
  return loader;
}
