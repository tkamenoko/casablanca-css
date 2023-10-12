import type { ModuleLinker } from 'node:vm';
import { resolve } from 'node:path';

import { normalizePath } from 'vite';

export const localModulesLinker: (params: {
  modulePath: string;
  baseLinker: ModuleLinker;
}) => ModuleLinker =
  ({ baseLinker, modulePath }) =>
  async (specifier, referencingModule, extra) => {
    const path = normalizePath(
      resolve(modulePath.split('/').slice(0, -1).join('/'), specifier),
    );
    return await baseLinker(path, referencingModule, extra);
  };
