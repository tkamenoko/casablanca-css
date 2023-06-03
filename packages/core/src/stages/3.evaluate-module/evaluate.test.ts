import { beforeEach, test } from 'vitest';
import type { ViteDevServer } from 'vite';
import { transformWithEsbuild, createServer } from 'vite';

import simpleModuleAsString from './fixtures/simple?raw';
import * as simpleModuleExports from './fixtures/simple';
import thirdPartyModuleAsString from './fixtures/thirdParty?raw';
import * as thirdPartyModuleExports from './fixtures/thirdParty';

import { evaluateModule } from '.';

type TestContext = {
  server: ViteDevServer;
};

beforeEach<TestContext>(async (ctx) => {
  ctx.server = await createServer();

  await ctx.server.listen();
  return async () => {
    await ctx.server.close();
  };
});

test<TestContext>('should evaluate module to get exported styles', async ({
  expect,
  server,
}) => {
  const variableNames = ['staticStyle', 'embedded', 'functionCall'] as const;
  const { code: jsCode } = await transformWithEsbuild(
    simpleModuleAsString,
    'simple.ts'
  );
  const { mapOfVariableNamesToStyles } = await evaluateModule({
    code: jsCode,
    moduleGraph: server.moduleGraph,
    moduleId: 'TODO!',
    variableNames: [...variableNames],
  });
  expect(mapOfVariableNamesToStyles.size).toEqual(variableNames.length);
  for (const variableName of variableNames) {
    const value = simpleModuleExports[variableName];
    expect(mapOfVariableNamesToStyles.get(variableName)?.style).toEqual(value);
  }
});

test<TestContext>('should evaluate module third party modules', async ({
  expect,
  server,
}) => {
  const variableNames = ['styleWithPolished'] as const;
  const { code: jsCode } = await transformWithEsbuild(
    thirdPartyModuleAsString,
    'thirdParty.ts'
  );
  const { mapOfVariableNamesToStyles } = await evaluateModule({
    code: jsCode,
    moduleGraph: server.moduleGraph,
    moduleId: 'TODO!',
    variableNames: [...variableNames],
  });
  expect(mapOfVariableNamesToStyles.size).toEqual(variableNames.length);
  for (const variableName of variableNames) {
    const value = thirdPartyModuleExports[variableName];
    expect(mapOfVariableNamesToStyles.get(variableName)?.style).toEqual(value);
  }
});
