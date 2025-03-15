import vm from "node:vm";
import type { Loader } from "@casablanca-css/eval/loaders";
import type { TransformContext } from "../types";
import { buildInitializeImportMeta } from "./initializeImportMeta";

export function createRelativeLoader(ctx: TransformContext): Loader {
  const loader: Loader = async ({
    basePath,
    importMeta,
    modulesCache,
    referencingModule,
    specifier,
  }) => {
    // resolve id as relative path
    const resolvedRelativePath = await ctx.resolve(specifier, basePath);
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
    const loaded = await ctx
      .load({
        id: resolvedRelativePath.id,
        resolveDependencies: true,
      })
      .then((r) =>
        typeof r.code === "string"
          ? { code: r.code, error: null }
          : {
              code: null,
              error: new Error(`Failed to load "${resolvedRelativePath.id}"`),
            },
      )
      .catch((e) => ({ code: null, error: e }));
    if (typeof loaded.code !== "string") {
      return { error: loaded.error, module: null };
    }

    const m = new vm.SourceTextModule(loaded.code, {
      context: referencingModule.context,
      identifier: `vm:module<relative>(${resolvedRelativePath.id})`,
      initializeImportMeta: buildInitializeImportMeta({
        contextifiedObject: referencingModule.context,
        importMeta,
      }),
    });
    modulesCache.set(resolvedRelativePath.id, m);
    return { error: null, module: m };
  };
  return loader;
}
