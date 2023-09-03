import type { ModuleLinker } from 'node:vm';
import { resolve } from 'node:path';

import { normalizePath } from 'vite';

export const localModulesLinker: (params: {
  moduleId: string;
  baseLinker: ModuleLinker;
}) => ModuleLinker =
  ({ baseLinker, moduleId }) =>
  async (specifier, referencingModule, extra) => {
    const path = normalizePath(
      resolve(moduleId.split('/').slice(0, -1).join('/'), specifier)
    );
    return await baseLinker(path, referencingModule, extra);
  };
