import type { ModuleLinker, Module } from 'node:vm';
import vm from 'node:vm';

import type { TransformContext } from '../types';

export function createLinker({
  modulePath,
  transformContext: ctx,
}: {
  modulePath: string;
  transformContext: TransformContext;
}): ModuleLinker {
  const modulesCache = new Map<string, Module>();
  const linker: ModuleLinker = async (specifier, referencingModule) => {
    const errors: unknown[] = [];
    {
      // resolve id as node_module
      const cached = modulesCache.get(specifier);
      if (cached) {
        return cached;
      }
      const imported = await import(specifier).catch(
        (e) => (errors.push(e), null),
      );
      if (imported) {
        const exportNames = Object.keys(imported);
        const m = new vm.SyntheticModule(
          exportNames,
          () => {
            exportNames.forEach((name) => m.setExport(name, imported[name]));
          },
          {
            context: referencingModule.context,
            identifier: `vm:module<node>(${specifier})`,
          },
        );
        modulesCache.set(specifier, m);
        return m;
      }
    }
    {
      // resolve id as vite-specific module
      const loaded = await ctx
        .load({ id: specifier, resolveDependencies: true })
        .catch((e) => (errors.push(e), null));
      if (loaded?.code) {
        const m = new vm.SourceTextModule(loaded.code, {
          context: referencingModule.context,
          identifier: `vm:module<vite>(${specifier})`,
        });
        modulesCache.set(specifier, m);
        return m;
      }
    }
    // resolve id as absolute path
    const resolvedAbsolutePath = await ctx.resolve(specifier);
    if (resolvedAbsolutePath) {
      const cached = modulesCache.get(resolvedAbsolutePath.id);
      if (cached) {
        return cached;
      }
      const loaded = await ctx
        .load({ id: resolvedAbsolutePath.id, resolveDependencies: true })
        .catch((e) => (errors.push(e), null));
      if (loaded?.code) {
        const m = new vm.SourceTextModule(loaded.code, {
          context: referencingModule.context,
          identifier: `vm:module<absolute>(${specifier})`,
        });
        modulesCache.set(resolvedAbsolutePath.id, m);
        return m;
      }
    }

    // resolve id as relative path
    const resolvedRelativePath = await ctx.resolve(specifier, modulePath);
    if (resolvedRelativePath) {
      const cached = modulesCache.get(resolvedRelativePath.id);
      if (cached) {
        return cached;
      }

      const loaded = await ctx
        .load({ id: resolvedRelativePath.id, resolveDependencies: true })
        .catch((e) => (errors.push(e), null));
      if (loaded?.code) {
        const m = new vm.SourceTextModule(loaded.code, {
          context: referencingModule.context,
          identifier: `vm:module<relative>(${specifier})`,
        });
        modulesCache.set(resolvedRelativePath.id, m);
        return m;
      }
    }
    console.error(errors.at(-1));
    throw new Error(
      `Failed to load "${specifier}" from "${referencingModule.identifier}"`,
    );
  };
  return linker;
}
