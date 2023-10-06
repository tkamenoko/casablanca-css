import { transformFromAstAsync, types } from '@babel/core';

import type { ModuleIdPrefix } from '@/types';

import type { CapturedVariableNames } from '../1.capture-tagged-styles';

import type { Options } from './assignStyles';
import { assignStylesPlugin } from './assignStyles';

type AssignStylesToCapturedVariablesArgs = {
  replaced: types.File;
  originalCode: string;
  temporalVariableNames: CapturedVariableNames;
  originalToTemporalMap: CapturedVariableNames;
  cssImportId: `${ModuleIdPrefix}${string}`;
};
export type AssignStylesToCapturedVariablesReturn = {
  transformed: string;
};

export async function assignStylesToCapturedVariables({
  replaced,
  originalCode,
  cssImportId,
  temporalVariableNames,
  originalToTemporalMap,
}: AssignStylesToCapturedVariablesArgs): Promise<AssignStylesToCapturedVariablesReturn> {
  const pluginOption: Options = {
    cssImportId,
    temporalVariableNames,
    originalToTemporalMap,
  };
  const result = await transformFromAstAsync(
    types.cloneNode(replaced),
    originalCode,
    {
      plugins: [[assignStylesPlugin, pluginOption]],
      sourceMaps: 'inline',
    },
  );
  if (!result) {
    throw new Error('Failed');
  }
  const { code: transformed } = result;
  if (!transformed) {
    throw new Error('Failed');
  }

  return { transformed };
}
