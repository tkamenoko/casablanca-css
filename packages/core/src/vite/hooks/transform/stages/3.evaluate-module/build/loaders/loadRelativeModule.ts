import vm, { type Module } from "node:vm";
import { buildInitializeImportMeta } from "../../initializeImportMeta";
import type { TransformContext } from "../../types";

type LoadRelativeModuleArgs = {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
  ctx: TransformContext;
  basePath: string;
  importMeta: Record<string, unknown>;
};

export async function loadRelativeModule({
  modulesCache,
  specifier,
  referencingModule,
  ctx,
  basePath,
  importMeta,
}: LoadRelativeModuleArgs): Promise<Module | null> {
  // resolve id as relative path
  const resolvedRelativePath = await ctx.resolve(specifier, basePath);
  if (!resolvedRelativePath) {
    return null;
  }
  const cached = modulesCache.get(resolvedRelativePath.id);
  if (cached) {
    return cached;
  }
  const loaded = await ctx
    .load({
      id: resolvedRelativePath.id,
      resolveDependencies: true,
    })
    .catch(() => null);
  if (typeof loaded?.code !== "string") {
    return null;
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
  return m;
}
