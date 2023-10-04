import { build } from 'vite';
import { assert, test as t } from 'vitest';

import { partialPlugin, type TransformResult } from '../fixtures/plugin';
import { buildModuleId } from '../fixtures/buildModuleId';

import * as assetModuleExports from './fixtures/useAssetFile';
import * as simpleModuleExports from './fixtures/simple';
import { testObjectHasEvaluatedStyles } from './fixtures/testHelpers';
import * as thirdPartyModuleExports from './fixtures/thirdParty';
import * as localModuleExports from './fixtures/useLocalFile';

type TestContext = {
  plugin: ReturnType<typeof partialPlugin>;
  transformResult: Partial<
    TransformResult<{
      mapOfVariableNamesToStyles: Map<
        string,
        {
          variableName: string;
          style: string;
        }
      >;
    }>
  >;
};

const test = t.extend<TestContext>({
  plugin: async ({ transformResult }, use) => {
    const plugin = partialPlugin({
      stage: 3,
      onExit: async (p) => {
        Object.assign(transformResult, p);
      },
    });
    await use(plugin);
  },
  transformResult: async ({ task: _ }, use) => {
    await use({});
  },
});

test('should evaluate module to get exported styles', async ({
  expect,
  plugin,
  transformResult,
}) => {
  const variableNames = ['staticStyle', 'embedded', 'functionCall'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/simple.ts',
    root: import.meta.url,
  });

  await build({
    configFile: false,
    plugins: [plugin],
    build: {
      write: false,
      rollupOptions: {
        input: moduleId,
      },
    },
    optimizeDeps: { disabled: true },
  });

  const { mapOfVariableNamesToStyles } = transformResult.stageResult ?? {};
  assert(mapOfVariableNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: simpleModuleExports,
    variableNames,
  });
});

test('should evaluate module using third party modules', async ({
  expect,
  plugin,
  transformResult,
}) => {
  const variableNames = ['styleWithPolished'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/thirdParty.ts',
    root: import.meta.url,
  });
  await build({
    configFile: false,
    plugins: [plugin],
    build: {
      write: false,
      rollupOptions: {
        input: moduleId,
      },
    },
    optimizeDeps: { disabled: true },
  });

  const { mapOfVariableNamesToStyles } = transformResult.stageResult ?? {};
  assert(mapOfVariableNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: thirdPartyModuleExports,
    variableNames,
  });
});

test<TestContext>('should evaluate module using local modules', async ({
  expect,
  plugin,
  transformResult,
}) => {
  const variableNames = ['styleWithLocalModule'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/useLocalFile.ts',
    root: import.meta.url,
  });

  await build({
    configFile: false,
    plugins: [plugin],
    build: {
      write: false,
      rollupOptions: {
        input: moduleId,
      },
    },
    optimizeDeps: { disabled: true },
  });

  const { mapOfVariableNamesToStyles } = transformResult.stageResult ?? {};
  assert(mapOfVariableNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: localModuleExports,
    variableNames,
  });
});

test('should evaluate module using non-script modules', async ({
  expect,
  plugin,
  transformResult,
}) => {
  const variableNames = ['className'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/useAssetFile.ts',
    root: import.meta.url,
  });

  await build({
    configFile: false,
    plugins: [plugin],
    build: {
      write: false,
      rollupOptions: {
        input: moduleId,
      },
    },
    optimizeDeps: { disabled: true },
  });

  const { mapOfVariableNamesToStyles } = transformResult.stageResult ?? {};
  assert(mapOfVariableNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: assetModuleExports,
    variableNames,
  });
});
