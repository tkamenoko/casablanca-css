import vm, { type Module } from "node:vm";
import { buildInitializeImportMeta } from "../../initializeImportMeta";
import type { LoadModuleReturn, TransformContext } from "../../types";

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
}: LoadViteModuleArgs): Promise<LoadModuleReturn> {
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
}
