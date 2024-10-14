import vm, { type Module } from "node:vm";
import { isVirtualCssModuleId } from "#@/vite/types/virtualCssModuleId";
import { isVirtualGlobalStyleId } from "#@/vite/types/virtualGlobalStyleId";
import { buildInitializeImportMeta } from "../../initializeImportMeta";
import type { LoadModuleReturn, TransformContext } from "../../types";

type LoadAbsoluteModuleArgs = {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
  ctx: TransformContext;
  importMeta: Record<string, unknown>;
};

export async function loadAbsoluteModule({
  modulesCache,
  specifier,
  referencingModule,
  ctx,
  importMeta,
}: LoadAbsoluteModuleArgs): Promise<LoadModuleReturn> {
  // casablanca modules must be resolved by casablanca plugin.
  const skipSelf =
    !isVirtualCssModuleId(specifier) && !isVirtualGlobalStyleId(specifier);
  // resolve id as absolute path
  const resolvedAbsolutePath = await ctx.resolve(specifier, undefined, {
    skipSelf,
  });
  if (!resolvedAbsolutePath) {
    return {
      error: new Error(`Failed to resolve "${specifier}"`),
      module: null,
    };
  }
  const cached = modulesCache.get(resolvedAbsolutePath.id);
  if (cached) {
    return { error: null, module: cached };
  }
  const loaded = await ctx
    .load({
      id: resolvedAbsolutePath.id,
      resolveDependencies: true,
    })
    .then((r) =>
      typeof r.code === "string"
        ? { code: r.code, error: null }
        : {
            code: null,
            error: new Error(`Failed to load "${resolvedAbsolutePath.id}"`),
          },
    )
    .catch((e) => ({ code: null, error: e }));
  if (typeof loaded.code !== "string") {
    return { error: loaded.error, module: null };
  }
  const m = new vm.SourceTextModule(loaded.code, {
    context: referencingModule.context,
    identifier: `vm:module<absolute>(${resolvedAbsolutePath.id})`,
    initializeImportMeta: buildInitializeImportMeta({
      contextifiedObject: referencingModule.context,
      importMeta,
    }),
  });
  modulesCache.set(resolvedAbsolutePath.id, m);
  return { error: null, module: m };
}
