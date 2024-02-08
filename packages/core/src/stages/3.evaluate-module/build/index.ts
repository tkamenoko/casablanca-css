import type { ModuleLinker, Module } from 'node:vm';
import vm from 'node:vm';
import { isBuiltin } from 'node:module';

import { isVirtualCssModuleId } from '@/vite/helpers/isVirtualCssModuleId';
import { isVirtualGlobalStyleId } from '@/vite/helpers/isVirtualGlobalStyleId';

import type { TransformContext } from '../types';

type CreateLinkerReturn = {
  linker: ModuleLinker;
};

export function createLinker({
  modulePath,
  transformContext: ctx,
}: {
  modulePath: string;
  transformContext: TransformContext;
}): CreateLinkerReturn {
  const modulesCache = new Map<string, Module>();
  const linker: ModuleLinker = async (specifier, referencingModule) => {
    const referencingPath =
      referencingModule.identifier.match(/\((?<path>.+)\)/)?.groups?.['path'] ??
      modulePath;
    const basePath =
      referencingPath === '*target*' ? modulePath : referencingPath;
    // macrostyles modules must be resolved by macrostyles plugin.
    const skipSelf =
      !isVirtualCssModuleId(specifier) && !isVirtualGlobalStyleId(specifier);

    builtin: {
      const cached = modulesCache.get(specifier);
      if (cached) {
        return cached;
      }
      if (!isBuiltin(specifier)) {
        break builtin;
      }
      const normalizedSpecifier = specifier.startsWith('node:')
        ? specifier
        : `node:${specifier}`;
      const imported = await import(normalizedSpecifier).catch(() => null);
      if (!imported) {
        break builtin;
      }
      const exportNames = Object.keys(imported);
      const m = new vm.SyntheticModule(
        exportNames,
        () => {
          exportNames.forEach((name) => m.setExport(name, imported[name]));
        },
        {
          context: referencingModule.context,
          identifier: `vm:module<builtin>(${specifier})`,
        },
      );
      const shortSpecifier = normalizedSpecifier.slice('node:'.length);
      modulesCache.set(normalizedSpecifier, m);
      isBuiltin(shortSpecifier) ? modulesCache.set(shortSpecifier, m) : void 0;

      return m;
    }
    node: {
      const cached = modulesCache.get(specifier);
      if (cached) {
        return cached;
      }
      // resolve id as node_modules
      const imported = await import(specifier).catch(() => null);
      if (!imported) {
        break node;
      }
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
    vite: {
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
        break vite;
      }

      const m = new vm.SourceTextModule(loaded.code, {
        context: referencingModule.context,
        identifier: `vm:module<vite>(${specifier})`,
      });
      modulesCache.set(specifier, m);
      return m;
    }
    absolute: {
      // resolve id as absolute path
      const resolvedAbsolutePath = await ctx.resolve(specifier, undefined, {
        skipSelf,
      });
      if (!resolvedAbsolutePath) {
        break absolute;
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
        break absolute;
      }
      const m = new vm.SourceTextModule(loaded.code, {
        context: referencingModule.context,
        identifier: `vm:module<absolute>(${resolvedAbsolutePath.id})`,
      });
      modulesCache.set(resolvedAbsolutePath.id, m);
      return m;
    }
    relative: {
      // resolve id as relative path
      const resolvedRelativePath = await ctx.resolve(specifier, basePath);
      if (!resolvedRelativePath) {
        break relative;
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
      if (typeof loaded?.code !== 'string') {
        break relative;
      }

      const m = new vm.SourceTextModule(loaded.code, {
        context: referencingModule.context,
        identifier: `vm:module<relative>(${resolvedRelativePath.id})`,
      });
      modulesCache.set(resolvedRelativePath.id, m);
      return m;
    }
    throw new Error(
      `Failed to load "${specifier}" from "${referencingModule.identifier}"`,
    );
  };
  return { linker };
}
