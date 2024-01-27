import type { types } from '@babel/core';
import { transformFromAstAsync } from '@babel/core';

import type { CssModuleIdPrefix } from '@/vite/types';

import type { CapturedVariableNames } from '../1.capture-tagged-styles';

import type { Options } from './assignStyles';
import { assignStylesPlugin } from './assignStyles';

type AssignStylesToCapturedVariablesArgs = {
  replaced: types.File;
  originalCode: string;
  temporalVariableNames: CapturedVariableNames;
  originalToTemporalMap: CapturedVariableNames;
  cssImportId: `${CssModuleIdPrefix}${string}`;
  isDev: boolean;
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
  isDev,
}: AssignStylesToCapturedVariablesArgs): Promise<AssignStylesToCapturedVariablesReturn> {
  const pluginOption: Options = {
    cssImportId,
    temporalVariableNames,
    originalToTemporalMap,
  };
  const result = await transformFromAstAsync(replaced, originalCode, {
    plugins: [[assignStylesPlugin, pluginOption]],
    sourceMaps: isDev ? 'inline' : false,
  });
  if (!result) {
    throw new Error('Failed');
  }
  const { code: transformed } = result;
  if (!transformed) {
    throw new Error('Failed');
  }

  return { transformed };
}
