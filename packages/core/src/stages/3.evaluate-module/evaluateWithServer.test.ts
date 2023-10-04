import { createServer, type ViteDevServer } from 'vite';
import { assert, test as t } from 'vitest';

import { partialPlugin, type TransformResult } from '../fixtures/plugin';
import { buildModuleId } from '../fixtures/buildModuleId';

import * as simpleModuleExports from './fixtures/simple';
import * as thirdPartyModuleExports from './fixtures/thirdParty';
import * as localModuleExports from './fixtures/useLocalFile';
import * as assetModuleExports from './fixtures/useAssetFile';
import { testObjectHasEvaluatedStyles } from './fixtures/testHelpers';

type TestContext = {
  server: ViteDevServer;
  transformResult: Partial<
    TransformResult<{
      mapOfClassNamesToStyles: Map<
        string,
        {
          temporalVariableName: string;
          originalName: string;
          style: string;
        }
      >;
    }>
  >;
};

const test = t.extend<TestContext>({
  server: async ({ transformResult }, use) => {
    const server = await createServer({
      plugins: [
        partialPlugin({
          stage: 3,
          onExit: async (p) => {
            Object.assign(transformResult, p);
          },
        }),
      ],
      appType: 'custom',
      server: {
        middlewareMode: true,
        hmr: false,
        preTransformRequests: false,
      },
      optimizeDeps: {
        disabled: true,
      },
    });
    await use(server);
    return server.close();
  },
  transformResult: async ({ task: _ }, use) => {
    await use({});
  },
});

test('should evaluate module to get exported styles', async ({
  expect,
  transformResult,
  server,
}) => {
  const variableNames = ['staticStyle', 'embedded', 'functionCall'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/simple.ts',
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  const { mapOfClassNamesToStyles } = transformResult.stageResult ?? {};
  assert(mapOfClassNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfClassNamesToStyles,
    moduleExports: simpleModuleExports,
    variableNames,
  });
});

test('should evaluate module using third party modules', async ({
  expect,
  server,
  transformResult,
}) => {
  const variableNames = ['styleWithPolished'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/thirdParty.ts',
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  const { mapOfClassNamesToStyles } = transformResult.stageResult ?? {};
  assert(mapOfClassNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfClassNamesToStyles,
    moduleExports: thirdPartyModuleExports,
    variableNames,
  });
});

test('should evaluate module using local modules', async ({
  expect,
  server,
  transformResult,
}) => {
  const variableNames = ['styleWithLocalModule'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/useLocalFile.ts',
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  const { mapOfClassNamesToStyles } = transformResult.stageResult ?? {};
  assert(mapOfClassNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfClassNamesToStyles,
    moduleExports: localModuleExports,
    variableNames,
  });
});

test('should evaluate module using non-script modules', async ({
  expect,
  server,
  transformResult,
}) => {
  const variableNames = ['className'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/useAssetFile.ts',
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  const { mapOfClassNamesToStyles } = transformResult.stageResult ?? {};
  assert(mapOfClassNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfClassNamesToStyles,
    moduleExports: assetModuleExports,
    variableNames,
  });
});
