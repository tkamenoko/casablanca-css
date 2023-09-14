import {
  createServer,
  type Plugin,
  type ResolvedConfig,
  type ViteDevServer,
} from 'vite';
import type { ExpectStatic } from 'vitest';
import { assert, beforeEach, test } from 'vitest';

import { isResolvedId } from '../../vite/isResolvedId';
import type { ModuleIdPrefix, PluginOption } from '../../types';
import { captureTaggedStyles } from '../1.capture-tagged-styles';
import { buildModuleId } from '../fixtures/buildModuleId';

import * as simpleModuleExports from './fixtures/simple';
import * as thirdPartyModuleExports from './fixtures/thirdParty';
import * as localModuleExports from './fixtures/useLocalFile';
import * as nonScriptModuleExports from './fixtures/useNonScriptFile';

import { evaluateModule } from '.';

function partialPlugin(
  options?: Partial<PluginOption> & {
    mapOfVariableNamesToStyles: Map<
      string,
      { variableName: string; style: string }
    >;
  }
): Plugin {
  const cssLookup = new Map<`${ModuleIdPrefix}${string}`, string>();

  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  const { babelOptions = {}, extensions = ['.js', '.jsx', '.ts', '.tsx'] } =
    options ?? {};
  return {
    name: 'macrostyles:partial',

    async transform(code, id) {
      if (!config) {
        throw new Error('Vite config is not resolved');
      }
      if (!server) {
        throw new Error('Vite dev server is not running');
      }
      const serverResolved = server;

      if (!extensions.some((e) => id.endsWith(e))) {
        return;
      }
      if (/\/node_modules\//.test(id)) {
        return;
      }

      const { capturedVariableNames, transformed: capturedCode } =
        captureTaggedStyles({ code, options: { babelOptions } });

      if (!capturedVariableNames.length) {
        return;
      }

      const { mapOfVariableNamesToStyles } = await evaluateModule({
        code: capturedCode,
        variableNames: capturedVariableNames,
        moduleId: id,
        load: async (importingId) => {
          const result = await serverResolved.ssrLoadModule(importingId);
          return result;
        },
        resolveId: async (importingId) => {
          const r = await this.resolve(importingId);
          if (!r) {
            return r;
          }
          return r.id;
        },
      });

      for (const [key, value] of mapOfVariableNamesToStyles) {
        options?.mapOfVariableNamesToStyles.set(key, value);
      }
      return capturedCode;
    },

    configResolved(config_) {
      config = config_;
    },
    configureServer(server_) {
      server = server_;
    },
    async buildStart() {
      if (!config) {
        throw new Error('Vite config is not resolved');
      }
      if (!server) {
        const {
          configFile: _unused,
          plugins,
          assetsInclude: __unused,
          ...rest
        } = config;

        server = await createServer({
          ...rest,
          plugins: plugins.slice(),
          appType: 'custom',
          server: { middlewareMode: true, hmr: false },
        });
      }
    },
    async buildEnd() {
      if (config?.command !== 'serve') {
        await server?.close();
      }
    },
    resolveId(id) {
      if (isResolvedId(id)) {
        return id;
      }
      return null;
    },
    load(id) {
      if (!isResolvedId(id)) {
        return;
      }
      const found = cssLookup.get(id);
      return found;
    },
  };
}

function testObjectHasEvaluatedStyles({
  expect,
  mapOfVariableNamesToStyles,
  variableNames,
  moduleExports,
}: {
  expect: ExpectStatic;
  moduleExports: Record<string, unknown>;
  mapOfVariableNamesToStyles: Map<
    string,
    {
      variableName: string;
      style: string;
    }
  >;
  variableNames: readonly string[];
}): void {
  expect(mapOfVariableNamesToStyles.size).toEqual(variableNames.length);
  for (const variableName of variableNames) {
    const value = moduleExports[variableName];
    expect(mapOfVariableNamesToStyles.get(variableName)?.style).toEqual(value);
  }
}

type TestContext = {
  server: ViteDevServer;
  mapOfVariableNamesToStyles: Map<
    string,
    { variableName: string; style: string }
  >;
};

beforeEach<TestContext>(async (ctx) => {
  ctx.mapOfVariableNamesToStyles = new Map();
  const server = await createServer({
    plugins: [
      partialPlugin({
        mapOfVariableNamesToStyles: ctx.mapOfVariableNamesToStyles,
      }),
    ],
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });

  ctx.server = server;
  return async () => {
    await ctx.server.close();
  };
});

test<TestContext>('should evaluate module to get exported styles', async ({
  expect,
  mapOfVariableNamesToStyles,
  server,
}) => {
  const variableNames = ['staticStyle', 'embedded', 'functionCall'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/simple.ts',
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: simpleModuleExports,
    variableNames,
  });
});

test<TestContext>('should evaluate module using third party modules', async ({
  expect,
  server,
  mapOfVariableNamesToStyles,
}) => {
  const variableNames = ['styleWithPolished'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/thirdParty.ts',
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: thirdPartyModuleExports,
    variableNames,
  });
});

test<TestContext>('should evaluate module using local modules', async ({
  expect,
  server,
  mapOfVariableNamesToStyles,
}) => {
  const variableNames = ['styleWithLocalModule'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/useLocalFile.ts',
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: localModuleExports,
    variableNames,
  });
});

test<TestContext>('should evaluate module using non-script modules', async ({
  expect,
  server,
  mapOfVariableNamesToStyles,
}) => {
  const variableNames = ['className'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/useNonScriptFile.ts',
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: nonScriptModuleExports,
    variableNames,
  });
});
