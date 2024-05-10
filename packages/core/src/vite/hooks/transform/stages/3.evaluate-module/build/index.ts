import type { Module, ModuleLinker } from "node:vm";
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

    const loadedModule =
      (await loadBuiltinModule({
        modulesCache,
        referencingModule,
        specifier,
      })) ??
      (await loadNodeModule({ modulesCache, referencingModule, specifier })) ??
      (await loadViteModule({
        ctx,
        modulesCache,
        referencingModule,
        specifier,
        importMeta,
      })) ??
      (await loadAbsoluteModule({
        ctx,
        modulesCache,
        referencingModule,
        specifier,
        importMeta,
      })) ??
      (await loadRelativeModule({
        basePath,
        ctx,
        modulesCache,
        referencingModule,
        specifier,
        importMeta,
      }));

    if (loadedModule) {
      return loadedModule;
    }

    throw new Error(
      `Failed to load "${specifier}" from "${referencingModule.identifier}"`,
    );
  };
  return { linker };
}
