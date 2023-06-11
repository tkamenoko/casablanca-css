import { SourceTextModule } from 'node:vm';
import type { ModuleLinker, Context } from 'node:vm';
import { resolve } from 'node:path';

import { normalizePath } from 'vite';

export const localModulesLinker: (params: {
  moduleId: string;
  contextifiedObject: Context;
}) => ModuleLinker =
  ({ contextifiedObject, moduleId }) =>
  async (specifier) => {
    const path = normalizePath(
      resolve(moduleId.split('/').slice(0, -1).join('/'), specifier)
    );

    const localModule = new SourceTextModule(
      `
export * from ${JSON.stringify(path)};
`,
      { context: contextifiedObject }
    );
    return localModule;
  };
