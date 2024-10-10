import vm, { type Module } from "node:vm";
import { buildInitializeImportMeta } from "../../initializeImportMeta";
import type { LoadModuleReturn, TransformContext } from "../../types";

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
}: LoadRelativeModuleArgs): Promise<LoadModuleReturn> {
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
}
