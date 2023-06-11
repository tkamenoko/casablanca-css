import { resolve } from 'node:path';

import { test } from 'vitest';
import { normalizePath, transformWithEsbuild } from 'vite';

import * as simpleModuleExports from './fixtures/simple';
import simpleModuleAsString from './fixtures/simple?raw';
import * as thirdPartyModuleExports from './fixtures/thirdParty';
import thirdPartyModuleAsString from './fixtures/thirdParty?raw';
import * as localModuleExports from './fixtures/useLocalFile';
import localModuleAsString from './fixtures/useLocalFile?raw';

import { evaluateModule } from '.';

test('should evaluate module to get exported styles', async ({ expect }) => {
  const variableNames = ['staticStyle', 'embedded', 'functionCall'] as const;
  const moduleId = normalizePath(
    resolve(
      import.meta.url
        .replace(/^file:\/+/, '')
        .split('/')
        .slice(0, -1)
        .join('/'),
      './fixtures/simple.ts'
    )
  );

  const { code } = await transformWithEsbuild(simpleModuleAsString, moduleId);
  const { mapOfVariableNamesToStyles } = await evaluateModule({
    code,
    variableNames: [...variableNames],
    moduleId,
  });
  expect(mapOfVariableNamesToStyles.size).toEqual(variableNames.length);
  for (const variableName of variableNames) {
    const value = simpleModuleExports[variableName];
    expect(mapOfVariableNamesToStyles.get(variableName)?.style).toEqual(value);
  }
});

test('should evaluate module using third party modules', async ({ expect }) => {
  const variableNames = ['styleWithPolished'] as const;
  const moduleId = normalizePath(
    resolve(
      import.meta.url
        .replace(/^file:\/+/, '')
        .split('/')
        .slice(0, -1)
        .join('/'),
      './fixtures/thirdParty.ts'
    )
  );

  const { code } = await transformWithEsbuild(
    thirdPartyModuleAsString,
    moduleId
  );

  const { mapOfVariableNamesToStyles } = await evaluateModule({
    code,
    variableNames: [...variableNames],
    moduleId,
  });
  expect(mapOfVariableNamesToStyles.size).toEqual(variableNames.length);
  for (const variableName of variableNames) {
    const value = thirdPartyModuleExports[variableName];
    expect(mapOfVariableNamesToStyles.get(variableName)?.style).toEqual(value);
  }
});

test('should evaluate module using local modules', async ({ expect }) => {
  const variableNames = ['styleWithLocalModule'] as const;
  const moduleId = normalizePath(
    resolve(
      import.meta.url
        .replace(/^file:\/+/, '')
        .split('/')
        .slice(0, -1)
        .join('/'),
      './fixtures/useLocalFile.ts'
    )
  );

  const { code } = await transformWithEsbuild(localModuleAsString, moduleId);

  const { mapOfVariableNamesToStyles } = await evaluateModule({
    code,
    variableNames: [...variableNames],
    moduleId,
  });
  expect(mapOfVariableNamesToStyles.size).toEqual(variableNames.length);
  for (const variableName of variableNames) {
    const value = localModuleExports[variableName];
    expect(mapOfVariableNamesToStyles.get(variableName)?.style).toEqual(value);
  }
});
