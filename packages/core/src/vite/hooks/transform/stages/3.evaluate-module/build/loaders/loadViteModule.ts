import vm, { type Module } from "node:vm";
import { buildInitializeImportMeta } from "../../initializeImportMeta";
import type { TransformContext } from "../../types";

type LoadViteModuleArgs = {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
  ctx: TransformContext;
  importMeta: Record<string, unknown>;
};

export async function loadViteModule({
  modulesCache,
  specifier,
  referencingModule,
  ctx,
  importMeta,
}: LoadViteModuleArgs): Promise<Module | null> {
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
    initializeImportMeta: buildInitializeImportMeta({
      contextifiedObject: referencingModule.context,
      importMeta,
    }),
  });
  modulesCache.set(specifier, m);
  return m;
}
