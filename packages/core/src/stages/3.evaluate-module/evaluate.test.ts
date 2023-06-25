import { resolve } from 'node:path';

import type { ExpectStatic } from 'vitest';
import { test } from 'vitest';
import { normalizePath, transformWithEsbuild } from 'vite';

import * as simpleModuleExports from './fixtures/simple';
import simpleModuleAsString from './fixtures/simple?raw';
import * as thirdPartyModuleExports from './fixtures/thirdParty';
import thirdPartyModuleAsString from './fixtures/thirdParty?raw';
import * as localModuleExports from './fixtures/useLocalFile';
import localModuleAsString from './fixtures/useLocalFile?raw';
import nonScriptModuleAsString from './fixtures/useNonScriptFile?raw';
import * as nonScriptModuleExports from './fixtures/useNonScriptFile';

import { evaluateModule } from '.';

function buildModuleId(relativePath: `./${string}`): string {
  return normalizePath(
    resolve(
      import.meta.url
        .replace(/^file:\/\//, '')
        .split('/')
        .slice(0, -1)
        .join('/'),
      relativePath
    )
  );
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

test('should evaluate module to get exported styles', async ({ expect }) => {
  const variableNames = ['staticStyle', 'embedded', 'functionCall'] as const;
  const moduleId = buildModuleId('./fixtures/simple.ts');

  const { code } = await transformWithEsbuild(simpleModuleAsString, moduleId);
  const { mapOfVariableNamesToStyles } = await evaluateModule({
    code,
    variableNames: [...variableNames],
    moduleId,
  });
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: simpleModuleExports,
    variableNames,
  });
});

test('should evaluate module using third party modules', async ({ expect }) => {
  const variableNames = ['styleWithPolished'] as const;
  const moduleId = buildModuleId('./fixtures/thirdParty.ts');

  const { code } = await transformWithEsbuild(
    thirdPartyModuleAsString,
    moduleId
  );

  const { mapOfVariableNamesToStyles } = await evaluateModule({
    code,
    variableNames: [...variableNames],
    moduleId,
  });
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: thirdPartyModuleExports,
    variableNames,
  });
});

test('should evaluate module using local modules', async ({ expect }) => {
  const variableNames = ['styleWithLocalModule'] as const;
  const moduleId = buildModuleId('./fixtures/useLocalFile.ts');

  const { code } = await transformWithEsbuild(localModuleAsString, moduleId);

  const { mapOfVariableNamesToStyles } = await evaluateModule({
    code,
    variableNames: [...variableNames],
    moduleId,
  });
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: localModuleExports,
    variableNames,
  });
});

test('should evaluate module using non-script modules', async ({ expect }) => {
  const variableNames = ['className'] as const;
  const moduleId = buildModuleId('./fixtures/useNonScriptFile.ts');

  const { code } = await transformWithEsbuild(
    nonScriptModuleAsString,
    moduleId
  );

  const { mapOfVariableNamesToStyles } = await evaluateModule({
    code,
    moduleId,
    variableNames: [...variableNames],
  });
  testObjectHasEvaluatedStyles({
    expect,
    mapOfVariableNamesToStyles,
    moduleExports: nonScriptModuleExports,
    variableNames,
  });
});
