import vm, { Module } from "node:vm";
import { TransformContext } from "../../types";

export async function loadRelativeModule({
  modulesCache,
  specifier,
  referencingModule,
  ctx,
  basePath,
}: {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
  ctx: TransformContext;
  basePath: string;
}): Promise<Module | null> {
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
  });
  modulesCache.set(resolvedRelativePath.id, m);
  return m;
}
