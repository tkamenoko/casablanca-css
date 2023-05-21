import type { VirtualModuleIdPrefix } from 'src/types';

type VariableName = string;

type AssignStylesToCapturedVariablesArgs = {
  code: string;
  variableNames: string[];
  cssImportId: `${VirtualModuleIdPrefix}/${string}`;
};
type AssignStylesToCapturedVariablesReturn = {
  transformed: string;
};

export function assignStylesToCapturedVariables(
  params: AssignStylesToCapturedVariablesArgs
): AssignStylesToCapturedVariablesReturn {
  throw new Error('TODO!');
}
