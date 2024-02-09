import type { Module, ModuleLinker } from "node:vm";
import type { ViteDevServer } from "vite";
import { loadBuiltinModule } from "../loaders/loadBuiltinModule";
import { loadNodeModule } from "../loaders/loadNodeModule";
import { loadRelativeModule } from "./loaders/loadRelativeModule";
import { loadViteModule } from "./loaders/loadViteModule";
import { normalizeSpecifier } from "./normalizeSpecifier";

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
      referencingModule.identifier.match(/\((?<path>.+)\)/)?.groups?.["path"] ??
      modulePath;
    const basePath =
      referencingPath === "*target*" ? modulePath : referencingPath;
    const serverSpecifier = normalizeSpecifier(specifier);

    const loadedModule =
      (await loadBuiltinModule({
        modulesCache,
        referencingModule,
        specifier: serverSpecifier,
      })) ??
      (await loadNodeModule({
        modulesCache,
        referencingModule,
        specifier: serverSpecifier,
      })) ??
      (await loadViteModule({
        modulesCache,
        referencingModule,
        server,
        specifier: serverSpecifier,
      })) ??
      (await loadRelativeModule({
        basePath,
        modulesCache,
        referencingModule,
        server,
        specifier: serverSpecifier,
      }));

    if (loadedModule) {
      return loadedModule;
    }

    throw new Error(`Failed to load "${serverSpecifier}" from "${modulePath}"`);
  };
  return { linker };
}
