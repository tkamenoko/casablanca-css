import type { Module, ModuleLinker } from "node:vm";
import { loadModule } from "../loadModule";
import { loadBuiltinModule } from "../loaders/loadBuiltinModule";
import { loadNodeModule } from "../loaders/loadNodeModule";
import type { TransformContext } from "../types";
import { loadAbsoluteModule } from "./loaders/loadAbsoluteModule";
import { loadRelativeModule } from "./loaders/loadRelativeModule";
import { loadViteModule } from "./loaders/loadViteModule";

type CreateLinkerArgs = {
  modulePath: string;
  transformContext: TransformContext;
  importMeta: Record<string, unknown>;
};

type CreateLinkerReturn = {
  linker: ModuleLinker;
};

export function createLinker({
  modulePath,
  transformContext: ctx,
  importMeta,
}: CreateLinkerArgs): CreateLinkerReturn {
  const modulesCache = new Map<string, Module>();
  const linker: ModuleLinker = async (specifier, referencingModule) => {
    const referencingPath =
      referencingModule.identifier.match(/\((?<path>.+)\)/)?.groups?.["path"] ??
      modulePath;
    const basePath =
      referencingPath === "*target*" ? modulePath : referencingPath;

    const loadModuleArgs = {
      basePath,
      ctx,
      modulesCache,
      referencingModule,
      specifier,
      importMeta,
    };

    const { error, module } = await loadModule(
      [
        loadBuiltinModule,
        loadNodeModule,
        loadViteModule,
        loadAbsoluteModule,
        loadRelativeModule,
      ],
      loadModuleArgs,
    );

    if (module) {
      return module;
    }

    throw error;
  };
  return { linker };
}
