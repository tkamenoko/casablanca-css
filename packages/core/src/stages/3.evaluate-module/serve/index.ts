import type { ModuleLinker, Module } from 'node:vm';
import vm from 'node:vm';
import { isBuiltin } from 'node:module';

import type { ViteDevServer } from 'vite';

import { normalizeSpecifier } from './normalizeSpecifier';

type CreateLinkerReturn = {
  linker: ModuleLinker;
};

export function createLinker({
  modulePath,
  server,
}: {
  modulePath: string;
  server: ViteDevServer;
}): CreateLinkerReturn {
  const modulesCache = new Map<string, Module>();
  const linker: ModuleLinker = async (specifier, referencingModule) => {
    const referencingPath =
      referencingModule.identifier.match(/\((?<path>.+)\)/)?.groups?.['path'] ??
      modulePath;
    const basePath =
      referencingPath === '*target*' ? modulePath : referencingPath;
    const serverSpecifier = normalizeSpecifier(specifier);

    builtin: {
      const cached = modulesCache.get(serverSpecifier);
      if (cached) {
        return cached;
      }
      if (!isBuiltin(serverSpecifier)) {
        break builtin;
      }
      const normalizedSpecifier = serverSpecifier.startsWith('node:')
        ? serverSpecifier
        : `node:${serverSpecifier}`;
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
          identifier: `vm:module<builtin>(${serverSpecifier})`,
        },
      );
      const shortSpecifier = normalizedSpecifier.slice('node:'.length);
      modulesCache.set(normalizedSpecifier, m);
      isBuiltin(shortSpecifier) ? modulesCache.set(shortSpecifier, m) : void 0;

      return m;
    }
    node: {
      // resolve id as node_module
      const cached = modulesCache.get(serverSpecifier);
      if (cached) {
        return cached;
      }
      const imported = await import(serverSpecifier).catch(() => null);
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
          identifier: `vm:module<node>(${serverSpecifier})`,
        },
      );
      modulesCache.set(serverSpecifier, m);
      return m;
    }
    vite: {
      const cached = modulesCache.get(serverSpecifier);
      if (cached) {
        return cached;
      }
      // resolve id as vite-specific module
      const resolvedModule = server.moduleGraph.getModuleById(serverSpecifier);
      if (!resolvedModule) {
        break vite;
      }
      const { url } = resolvedModule;
      const loaded = await server.ssrLoadModule(url).catch(() => null);
      if (!loaded) {
        break vite;
      }

      const exportNames = Object.keys(loaded);
      const m = new vm.SyntheticModule(
        exportNames,
        () => {
          exportNames.forEach((name) => m.setExport(name, loaded[name]));
        },
        {
          context: referencingModule.context,
          identifier: `vm:module<vite>(${serverSpecifier})`,
        },
      );
      modulesCache.set(serverSpecifier, m);
      return m;
    }
    relative: {
      // resolve id as relative path
      const resolvedRelativePath = await server.pluginContainer.resolveId(
        serverSpecifier,
        basePath,
      );

      if (!resolvedRelativePath) {
        break relative;
      }
      const cached = modulesCache.get(resolvedRelativePath.id);
      if (cached) {
        return cached;
      }

      const resolvedModule = server.moduleGraph.getModuleById(
        resolvedRelativePath.id,
      );

      const url = resolvedModule?.url ?? resolvedRelativePath.id;

      const loaded = await server.ssrLoadModule(url).catch(() => null);
      if (!loaded) {
        break relative;
      }

      const exportNames = Object.keys(loaded);
      const m = new vm.SyntheticModule(
        exportNames,
        () => {
          exportNames.forEach((name) => m.setExport(name, loaded[name]));
        },
        {
          context: referencingModule.context,
          identifier: `vm:module<relative>(${serverSpecifier})`,
        },
      );
      modulesCache.set(serverSpecifier, m);
      return m;
    }
    throw new Error(`Failed to load "${serverSpecifier}" from "${modulePath}"`);
  };
  return { linker };
}
