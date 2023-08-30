import type { ModuleLinker, Context } from 'node:vm';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { normalizePath } from 'vite';

export const staticAssetsLinker: (params: {
  moduleId: string;
  contextifiedObject: Context;
  load: (id: string) => Promise<string>;
}) => ModuleLinker =
  ({ load, moduleId, contextifiedObject }) =>
  async (specifier) => {
    const path = normalizePath(
      resolve(moduleId.split('/').slice(0, -1).join('/'), specifier)
    );

    const source = await load(path);
    const module = new vm.SourceTextModule(source, {
      context: contextifiedObject,
    });

    return module;
  };
