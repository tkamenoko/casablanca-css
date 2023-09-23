import { createServer, type ViteDevServer } from 'vite';
import { assert, beforeEach, test } from 'vitest';

import { buildModuleId } from '../fixtures/buildModuleId';

import * as simpleModuleExports from './fixtures/simple';
import * as thirdPartyModuleExports from './fixtures/thirdParty';
import * as localModuleExports from './fixtures/useLocalFile';
import * as assetModuleExports from './fixtures/useAssetFile';
import { partialPlugin } from './fixtures/plugin';
import { testObjectHasEvaluatedStyles } from './fixtures/testHelpers';

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
    optimizeDeps: { disabled: true },
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
    relativePath: './fixtures/useAssetFile.ts',
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: assetModuleExports,
    variableNames,
  });
});
