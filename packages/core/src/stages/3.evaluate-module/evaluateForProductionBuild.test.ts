import { build } from 'vite';
import { test as rawTest } from 'vitest';

import { buildModuleId } from '../fixtures/buildModuleId';

import * as assetModuleExports from './fixtures/useAssetFile';
import * as localModuleExports from './fixtures/useLocalFile';
import * as thirdPartyModuleExports from './fixtures/thirdParty';
import * as simpleModuleExports from './fixtures/simple';
import { partialPlugin } from './fixtures/plugin';
import { testObjectHasEvaluatedStyles } from './fixtures/testHelpers';

type TestContext = {
  mapOfVariableNamesToStyles: Map<
    string,
    {
      variableName: string;
      style: string;
    }
  >;
};

const test = rawTest.extend<TestContext>({
  mapOfVariableNamesToStyles: async ({ task: _task }, use) => {
    await use(new Map());
  },
});

test('should evaluate module to get exported styles', async ({
  expect,
  mapOfVariableNamesToStyles,
}) => {
  const variableNames = ['staticStyle', 'embedded', 'functionCall'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/simple.ts',
    root: import.meta.url,
  });

  await build({
    configFile: false,
    plugins: [partialPlugin({ mapOfVariableNamesToStyles })],
    build: {
      write: false,
      rollupOptions: {
        input: moduleId,
      },
    },
    optimizeDeps: { disabled: true },
  });

  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: simpleModuleExports,
    variableNames,
  });
});

test('should evaluate module using third party modules', async ({
  expect,
  mapOfVariableNamesToStyles,
}) => {
  const variableNames = ['styleWithPolished'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/thirdParty.ts',
    root: import.meta.url,
  });
  await build({
    configFile: false,
    plugins: [partialPlugin({ mapOfVariableNamesToStyles })],
    build: {
      write: false,
      rollupOptions: {
        input: moduleId,
      },
    },
    optimizeDeps: { disabled: true },
  });

  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: thirdPartyModuleExports,
    variableNames,
  });
});

test<TestContext>('should evaluate module using local modules', async ({
  expect,
  mapOfVariableNamesToStyles,
}) => {
  const variableNames = ['styleWithLocalModule'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/useLocalFile.ts',
    root: import.meta.url,
  });

  await build({
    configFile: false,
    plugins: [partialPlugin({ mapOfVariableNamesToStyles })],
    build: {
      write: false,
      rollupOptions: {
        input: moduleId,
      },
    },
    optimizeDeps: { disabled: true },
  });
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: localModuleExports,
    variableNames,
  });
});

test('should evaluate module using non-script modules', async ({
  expect,
  mapOfVariableNamesToStyles,
}) => {
  const variableNames = ['className'] as const;
  const moduleId = buildModuleId({
    relativePath: './fixtures/useAssetFile.ts',
    root: import.meta.url,
  });

  await build({
    configFile: false,
    plugins: [partialPlugin({ mapOfVariableNamesToStyles })],
    build: {
      write: false,
      rollupOptions: {
        input: moduleId,
      },
    },
    optimizeDeps: { disabled: true },
  });
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: assetModuleExports,
    variableNames,
  });
});
