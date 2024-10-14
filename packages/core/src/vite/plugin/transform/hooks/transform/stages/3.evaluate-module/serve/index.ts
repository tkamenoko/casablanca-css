import type { Module, ModuleLinker } from "node:vm";
import type { ViteDevServer } from "vite";
import { loadModule } from "../loadModule";
import { loadBuiltinModule } from "../loaders/loadBuiltinModule";
import { loadNodeModule } from "../loaders/loadNodeModule";
import { loadRelativeModule } from "./loaders/loadRelativeModule";
import { loadViteModule } from "./loaders/loadViteModule";
import { normalizeSpecifier } from "./normalizeSpecifier";

type CreateLinkerArgs = { modulePath: string; server: ViteDevServer };

type CreateLinkerReturn = {
  linker: ModuleLinker;
};

export function createLinker({
  modulePath,
  server,
}: CreateLinkerArgs): CreateLinkerReturn {
  const modulesCache = new Map<string, Module>();
  const linker: ModuleLinker = async (specifier, referencingModule) => {
    const referencingPath =
      referencingModule.identifier.match(/\((?<path>.+)\)/)?.groups?.["path"] ??
      modulePath;
    const basePath =
      referencingPath === "*target*" ? modulePath : referencingPath;
    const serverSpecifier = normalizeSpecifier(specifier);

    const loadModuleArgs = {
      basePath,
      modulesCache,
      referencingModule,
      server,
      specifier: serverSpecifier,
    };

    const { error, module } = await loadModule(
      [loadBuiltinModule, loadNodeModule, loadViteModule, loadRelativeModule],
      loadModuleArgs,
    );

    if (module) {
      return module;
    }

    throw error;
  };
  return { linker };
}
