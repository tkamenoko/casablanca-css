import vm, { type Module } from "node:vm";
import type { TransformContext } from "../../types";

export async function loadViteModule({
  modulesCache,
  specifier,
  referencingModule,
  ctx,
}: {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
  ctx: TransformContext;
}): Promise<Module | null> {
  const cached = modulesCache.get(specifier);
  if (cached) {
    return cached;
  }
  // resolve id as vite-specific module
  const loaded = await ctx
    .load({
      id: specifier,
      resolveDependencies: true,
    })
    .catch(() => null);
  if (!loaded?.code) {
    return null;
  }

  const m = new vm.SourceTextModule(loaded.code, {
    context: referencingModule.context,
    identifier: `vm:module<vite>(${specifier})`,
  });
  modulesCache.set(specifier, m);
  return m;
}
