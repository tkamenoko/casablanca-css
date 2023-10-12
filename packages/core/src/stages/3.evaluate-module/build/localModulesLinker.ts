import type { ModuleLinker } from 'node:vm';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { normalizePath } from 'vite';

export const localModulesLinker: (params: {
  modulePath: string;
  load: (id: string) => Promise<string>;
}) => ModuleLinker =
  ({ load, modulePath }) =>
  async (specifier, referencingModule) => {
    const path = normalizePath(
      resolve(modulePath.split('/').slice(0, -1).join('/'), specifier),
    );
    const code = await load(path);
    const m = new vm.SourceTextModule(code, {
      context: referencingModule.context,
    });
    return m;
  };
