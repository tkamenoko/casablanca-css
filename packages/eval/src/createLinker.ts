import type { Module, ModuleLinker } from "node:vm";
import type { Loader } from "./loaders/types";
import { loadModule } from "./loadModule";

type CreateLinkerArgs = {
  modulePath: string;
  loaders: Loader[];
  importMeta: Record<string, unknown>;
};
type CreateLinkerReturn = { linker: ModuleLinker };

export function createLinker({
  loaders,
  modulePath,
  importMeta,
}: CreateLinkerArgs): CreateLinkerReturn {
  const modulesCache = new Map<string, Module>();
  const linker: ModuleLinker = async (specifier, referencingModule) => {
    const referencingPath =
      referencingModule.identifier.match(/\((?<path>.+)\)/)?.groups?.["path"] ??
      modulePath;
    const basePath =
      referencingPath === "*target*" ? modulePath : referencingPath;

    const { error, module } = await loadModule(loaders, {
      basePath,
      importMeta,
      modulesCache,
      referencingModule,
      specifier,
    });

    if (module) {
      return module;
    }

    throw error;
  };
  return { linker };
}
