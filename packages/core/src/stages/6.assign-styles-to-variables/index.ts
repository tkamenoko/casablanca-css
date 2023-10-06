import { transformSync } from '@babel/core';

import type { ModuleIdPrefix } from '@/types';

import type { CapturedVariableNames } from '../1.capture-tagged-styles';

import type { Options } from './assignStyles';
import { assignStylesPlugin } from './assignStyles';

type AssignStylesToCapturedVariablesArgs = {
  code: string;
  temporalVariableNames: CapturedVariableNames;
  originalToTemporalMap: CapturedVariableNames;
  cssImportId: `${ModuleIdPrefix}${string}`;
};
export type AssignStylesToCapturedVariablesReturn = {
  transformed: string;
};

export function assignStylesToCapturedVariables({
  code,
  cssImportId,
  temporalVariableNames,
  originalToTemporalMap,
}: AssignStylesToCapturedVariablesArgs): AssignStylesToCapturedVariablesReturn {
  const pluginOption: Options = {
    cssImportId,
    temporalVariableNames,
    originalToTemporalMap,
  };
  const result = transformSync(code, {
    plugins: [[assignStylesPlugin, pluginOption]],
    sourceMaps: 'inline',
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
