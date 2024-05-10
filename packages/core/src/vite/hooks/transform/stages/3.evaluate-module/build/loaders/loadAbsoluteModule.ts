import vm, { type Module } from "node:vm";
import { isVirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import { isVirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";
import { buildInitializeImportMeta } from "../../initializeImportMeta";
import type { TransformContext } from "../../types";

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
}: LoadAbsoluteModuleArgs): Promise<Module | null> {
  // casablanca modules must be resolved by casablanca plugin.
  const skipSelf =
    !isVirtualCssModuleId(specifier) && !isVirtualGlobalStyleId(specifier);
  // resolve id as absolute path
  const resolvedAbsolutePath = await ctx.resolve(specifier, undefined, {
    skipSelf,
  });
  if (!resolvedAbsolutePath) {
    return null;
  }
  const cached = modulesCache.get(resolvedAbsolutePath.id);
  if (cached) {
    return cached;
  }
  const loaded = await ctx
    .load({
      id: resolvedAbsolutePath.id,
      resolveDependencies: true,
    })
    .catch(() => null);
  if (!loaded?.code) {
    return null;
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
  return m;
}
